from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
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

# Initialize sentiment analysis pipeline
try:
    sentiment_analyzer = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
except Exception as e:
    logger.error(f"Failed to initialize sentiment analyzer: {e}")
    sentiment_analyzer = None

# Function to compute satisfaction score
def compute_satisfaction_score(rating, comment):
    try:
        # Normalize rating (1-5) to (0-100)
        normalized_rating = ((rating - 1) / 4) * 100

        # Perform sentiment analysis on the comment
        sentiment_score = 50  # Default to neutral if sentiment analysis fails
        if sentiment_analyzer:
            result = sentiment_analyzer(comment)[0]
            # Convert sentiment score to 0-100 scale
            sentiment_score = (result['score'] * 100) if result['label'] == 'POSITIVE' else ((1 - result['score']) * 100)

        # Weighted combination: 60% rating, 40% sentiment
        satisfaction_score = (0.6 * normalized_rating) + (0.4 * sentiment_score)
        return round(max(0, min(100, satisfaction_score)))
    except Exception as e:
        logger.error(f"Error computing satisfaction score: {e}")
        # Fallback to rating-based score
        return round(((rating - 1) / 4) * 100)

# Route for image analysis
@app.route('/analyze', methods=['POST'])
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

        # Validate required fields
        required_fields = ['distance', 'osrmDuration', 'hour', 'weather', 'vehicleType']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        distance = float(data['distance'])  # in km
        osrm_duration = float(data['osrmDuration'])  # in seconds
        hour = int(data['hour'])
        weather = data['weather'].title()  # e.g., 'Clear', 'Clouds'
        vehicle_type = data['vehicleType'].title()  # e.g., 'Car', 'Motorcycle'

        # Validate input ranges
        if distance <= 0:
            return jsonify({'error': 'Distance must be positive'}), 400
        if osrm_duration <= 0:
            return jsonify({'error': 'OSRM duration must be positive'}), 400
        if hour < 0 or hour > 23:
            return jsonify({'error': 'Hour must be between 0 and 23'}), 400

        # Validate weather category
        known_weather_categories = weather_encoder.classes_
        if weather not in known_weather_categories:
            return jsonify({
                'error': f'Invalid weather value: "{weather}". Expected one of: {", ".join(known_weather_categories)}'
            }), 400

        # Validate vehicle type
        known_vehicle_types = vehicle_encoder.classes_
        if vehicle_type not in known_vehicle_types:
            return jsonify({
                'error': f'Invalid vehicle type: "{vehicle_type}". Expected one of: {", ".join(known_vehicle_types)}'
            }), 400

        # Encode features
        weather_encoded = weather_encoder.transform([weather])[0]
        vehicle_encoded = vehicle_encoder.transform([vehicle_type])[0]
        logger.info(f"Encoded values: weather={weather_encoded}, vehicle_type={vehicle_encoded}")

        # Normalize features
        distance_meters = distance * 1000  # Convert km to meters
        osrm_duration_minutes = osrm_duration / 60  # Convert seconds to minutes
        hour_normalized = hour / 23.0  # Normalize hour to [0, 1]

        # Prepare features for prediction
        features = np.array([[distance_meters, osrm_duration_minutes, hour_normalized, weather_encoded, vehicle_encoded]])
        logger.info(f"Normalized features for prediction: {features}")

        # Make prediction using the traffic model
        try:
            predicted_duration = traffic_model.predict(features)[0]
            logger.info(f"Model predicted duration (minutes): {predicted_duration}")
            predicted_duration = predicted_duration * 60  # Convert minutes to seconds
        except Exception as e:
            logger.error(f"Model prediction failed: {e}")
            return jsonify({'error': f'Failed to predict duration: {str(e)}'}), 500

        # Ensure positive duration
        predicted_duration = max(predicted_duration, 60)  # Minimum 1 minute
        logger.info(f"Final predicted duration (seconds): {predicted_duration}")

        return jsonify({'predictedDuration': float(predicted_duration)})
    except ValueError as ve:
        logger.error(f"Value error in duration prediction: {ve}")
        return jsonify({'error': f'Invalid input format: {str(ve)}'}), 400
    except Exception as e:
        logger.error(f"Error in duration prediction: {e}")
        return jsonify({'error': f'Failed to predict duration: {str(e)}'}), 500

# Route for computing satisfaction score
@app.route('/compute_satisfaction', methods=['POST'])
def compute_satisfaction():
    try:
        data = request.get_json()
        logger.info(f"Received data for satisfaction score: {data}")

        # Validate required fields
        required_fields = ['rating', 'comment']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        rating = data['rating']
        comment = data['comment']

        # Validate rating
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be a number between 1 and 5'}), 400

        # Validate comment
        if not isinstance(comment, str) or not comment.strip():
            return jsonify({'error': 'Comment must be a non-empty string'}), 400

        # Compute satisfaction score
        satisfaction_score = compute_satisfaction_score(rating, comment)

        return jsonify({'satisfactionScore': satisfaction_score})
    except Exception as e:
        logger.error(f"Error in satisfaction score computation: {e}")
        return jsonify({'error': f'Failed to compute satisfaction score: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)