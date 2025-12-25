from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
from prophet import Prophet
import pandas as pd
import joblib
import logging
from transformers import pipeline

app = Flask(__name__)

# Configure CORS to allow requests from the frontend
CORS(app, resources={r"*": {"origins": "http://localhost:5173"}})

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the pre-trained image analysis model
model = MobileNetV2(weights='imagenet')

# Load Prophet models for forecasting
try:
    model_donations = joblib.load('donation_forecast_model2.pkl')
    model_requests = joblib.load('request_forecast_model2.pkl')
except FileNotFoundError as e:
    logger.error(f"Failed to load Prophet models: {e}")
    model_donations = None
    model_requests = None

# Load traffic prediction model, weather encoder, and vehicle encoder
try:
    traffic_model = joblib.load('traffic_model.pkl')
    weather_encoder = joblib.load('weather_encoder.pkl')
    vehicle_encoder = joblib.load('vehicle_encoder.pkl')
except FileNotFoundError as e:
    logger.error(f"Failed to load traffic model or encoders: {e}")
    traffic_model = None
    weather_encoder = None
    vehicle_encoder = None

# Load food quantity and waste models
try:
    food_quantity_model = load_model('food_quantity_model.keras')
    food_waste_model = load_model('food_waste_model.keras')
    scaler = joblib.load('scaler.pkl')
    feature_columns = joblib.load('feature_columns.pkl')
    feature_importance = joblib.load('feature_importance.pkl')
except FileNotFoundError as e:
    logger.error(f"Failed to load food models or artifacts: {e}")
    food_quantity_model = None
    food_waste_model = None
    scaler = None
    feature_columns = None
    feature_importance = None

# Initialize sentiment analysis pipeline
try:
    sentiment_analyzer = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
except Exception as e:
    logger.error(f"Failed to initialize sentiment analyzer: {e}")
    sentiment_analyzer = None

# Function to compute satisfaction score
def compute_satisfaction_score(rating, comment):
    try:
        normalized_rating = ((rating - 1) / 4) * 100
        sentiment_score = 50
        if sentiment_analyzer:
            result = sentiment_analyzer(comment)[0]
            sentiment_score = (result['score'] * 100) if result['label'] == 'POSITIVE' else ((1 - result['score']) * 100)
        satisfaction_score = (0.6 * normalized_rating) + (0.4 * sentiment_score)
        return round(max(0, min(100, satisfaction_score)))
    except Exception as e:
        logger.error(f"Error computing satisfaction score: {e}")
        return round(((rating - 1) / 4) * 100)

# Helper function to preprocess input data
def preprocess_input(data):
    try:
        input_data = pd.DataFrame([data])
        numerical_cols = ['Number of Guests', 'Quantity of Food'] if 'Quantity of Food' in data else ['Number of Guests']
        for col in numerical_cols:
            input_data[col] = pd.to_numeric(input_data[col], errors='coerce')
        if input_data[numerical_cols].isna().any().any():
            raise ValueError("Invalid numerical inputs")

        categorical_columns = [
            'Type of Food', 'Event Type', 'Storage Conditions',
            'Purchase History', 'Seasonality', 'Preparation Method',
            'Geographical Location', 'Pricing'
        ]
        input_encoded = pd.get_dummies(input_data, columns=categorical_columns, drop_first=True)

        for col in feature_columns:
            if col not in input_encoded.columns:
                input_encoded[col] = 0
        input_encoded = input_encoded[feature_columns]

        input_scaled = scaler.transform(input_encoded)
        return input_scaled
    except Exception as e:
        logger.error(f"Error preprocessing input: {e}")
        raise

# Route for image analysis@app.route('/analyze', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    try:
        img = Image.open(file.stream).convert('RGB').resize((224, 224))
    except Exception as e:
        logger.error(f"Error opening image: {e}")
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 400

    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    predictions = model.predict(img_array)
    decoded = decode_predictions(predictions, top=3)[0]

    results = [{'description': desc, 'confidence': float(prob)} for (_, desc, prob) in decoded]
    return jsonify(results)

# Route for donation forecasting
@app.route('/forecast/donations', methods=['GET'])
def forecast_donations():
    if not model_donations:
        return jsonify({'error': 'Donation forecast model not loaded'}), 500
    try:
        days = int(request.args.get('days', 30))
        if days <= 0:
            return jsonify({'error': 'Days must be a positive integer'}), 400
        future = model_donations.make_future_dataframe(periods=days)
        forecast = model_donations.predict(future)
        forecast_data = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days)
        forecast_data['ds'] = forecast_data['ds'].dt.strftime('%Y-%m-%d')
        return jsonify(forecast_data.to_dict(orient='records'))
    except Exception as e:
        logger.error(f"Error in donation forecast: {e}")
        return jsonify({'error': f'Failed to generate donation forecast: {str(e)}'}), 500

# Route for request forecasting
@app.route('/forecast/requests', methods=['GET'])
def forecast_requests():
    if not model_requests:
        return jsonify({'error': 'Request forecast model not loaded'}), 500
    try:
        days = int(request.args.get('days', 30))
        if days <= 0:
            return jsonify({'error': 'Days must be a positive integer'}), 400
        future = model_requests.make_future_dataframe(periods=days)
        forecast = model_requests.predict(future)
        forecast_data = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days)
        forecast_data['ds'] = forecast_data['ds'].dt.strftime('%Y-%m-%d')
        return jsonify(forecast_data.to_dict(orient='records'))
    except Exception as e:
        logger.error(f"Error in request forecast: {e}")
        return jsonify({'error': f'Failed to generate request forecast: {str(e)}'}), 500

# Route for predicting route duration
@app.route('/predict_duration', methods=['POST'])
def predict_duration():
    if not traffic_model or not weather_encoder or not vehicle_encoder:
        return jsonify({'error': 'Traffic prediction model or encoders not loaded'}), 500
    try:
        data = request.get_json()
        logger.info(f"Received data for duration prediction: {data}")
        required_fields = ['distance', 'osrmDuration', 'hour', 'weather', 'vehicleType']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        distance = float(data['distance'])
        osrm_duration = float(data['osrmDuration'])
        hour = int(data['hour'])
        weather = data['weather'].title()
        vehicle_type = data['vehicleType'].title()
        if distance <= 0 or osrm_duration <= 0 or hour < 0 or hour > 23:
            return jsonify({'error': 'Invalid input ranges'}), 400
        if weather not in weather_encoder.classes_ or vehicle_type not in vehicle_encoder.classes_:
            return jsonify({'error': 'Invalid weather or vehicle type'}), 400
        weather_encoded = weather_encoder.transform([weather])[0]
        vehicle_encoded = vehicle_encoder.transform([vehicle_type])[0]
        distance_meters = distance * 1000
        osrm_duration_minutes = osrm_duration / 60
        hour_normalized = hour / 23.0
        features = np.array([[distance_meters, osrm_duration_minutes, hour_normalized, weather_encoded, vehicle_encoded]])
        predicted_duration = traffic_model.predict(features)[0] * 60
        predicted_duration = max(predicted_duration, 60)
        return jsonify({'predictedDuration': float(predicted_duration)})
    except Exception as e:
        logger.error(f"Error in duration prediction: {e}")
        return jsonify({'error': f'Failed to predict duration: {str(e)}'}), 500

# Route for computing satisfaction score
@app.route('/compute_satisfaction', methods=['POST'])
def compute_satisfaction():
    try:
        data = request.get_json()
        logger.info(f"Received data for satisfaction score: {data}")
        required_fields = ['rating', 'comment']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        rating = data['rating']
        comment = data['comment']
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5 or not isinstance(comment, str) or not comment.strip():
            return jsonify({'error': 'Invalid rating or comment'}), 400
        satisfaction_score = compute_satisfaction_score(rating, comment)
        return jsonify({'satisfactionScore': satisfaction_score})
    except Exception as e:
        logger.error(f"Error in satisfaction score computation: {e}")
        return jsonify({'error': f'Failed to compute satisfaction score: {str(e)}'}), 500

# Route for forecasting food demand
@app.route('/forecast_food_demand', methods=['POST'])
def forecast_food_demand():
    if not food_quantity_model or not scaler or not feature_columns:
        return jsonify({'error': 'Food demand model or artifacts not loaded'}), 500
    try:
        data = request.get_json()
        logger.info(f"Received data for food demand forecasting: {data}")
        required_fields = [
            'Number of Guests', 'Type of Food', 'Event Type', 'Storage Conditions',
            'Purchase History', 'Seasonality', 'Preparation Method', 'Geographical Location', 'Pricing'
        ]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        input_scaled = preprocess_input(data)
        prediction = food_quantity_model.predict(input_scaled, verbose=0)[0][0]
        prediction = max(0, prediction)
        return jsonify({'predictedQuantity': float(prediction)})
    except Exception as e:
        logger.error(f"Error in food demand forecasting: {e}")
        return jsonify({'error': f'Failed to forecast food demand: {str(e)}'}), 500

# Route for predicting food waste
@app.route('/predict_food_waste', methods=['POST'])
def predict_food_waste():
    if not food_waste_model or not scaler or not feature_columns:
        return jsonify({'error': 'Food waste model or artifacts not loaded'}), 500
    try:
        data = request.get_json()
        logger.info(f"Received data for food waste prediction: {data}")
        required_fields = [
            'Number of Guests', 'Quantity of Food', 'Type of Food', 'Event Type',
            'Storage Conditions', 'Purchase History', 'Seasonality',
            'Preparation Method', 'Geographical Location', 'Pricing'
        ]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
        input_scaled = preprocess_input(data)
        prediction = food_waste_model.predict(input_scaled, verbose=0)[0][0]
        prediction = max(0, prediction)
        return jsonify({'predictedWaste': float(prediction)})
    except Exception as e:
        logger.error(f"Error in food waste prediction: {e}")
        return jsonify({'error': f'Failed to predict food waste: {str(e)}'}), 500

# Route for waste factors
@app.route('/waste-factors', methods=['GET'])
def get_waste_factors():
    if feature_importance is None:
        return jsonify({'error': 'Feature importance data not loaded'}), 500
    try:
        # Convert DataFrame to dictionary with feature and importance
        factors = feature_importance.set_index('feature')['importance'].to_dict()
        return jsonify(factors)
    except Exception as e:
        logger.error(f"Error processing waste factors: {e}")
        return jsonify({'error': f'Failed to load waste factors: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)