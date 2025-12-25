import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  padding: 30px;
  flex: 1 1 250px;
  max-width: 300px;
  min-height: 400px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  animation: ${float} 6s ease-in-out infinite;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(34, 139, 34, 0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 0;
    background: linear-gradient(to bottom, #228b22, #56ab2f);
    transition: height 0.3s ease;
  }

  &:hover::before {
    height: 100%;
  }
`;

const Title = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #1a7a1a;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s ease;
`;

const Details = styled.p`
  font-size: 16px;
  color: #3a5a3a;
  margin: 5px 0;
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  color: white;
  background: ${({ status }) => {
    switch (status) {
      case 'pending':
        return '#f0ad4e';
      case 'fulfilled':
        return '#28a745';
      case 'partially_fulfilled':
        return '#6c757d';
      case 'approved':
        return '#228b22';
      case 'rejected':
        return '#dc3545';
      default:
        return '#888';
    }
  }};
`;

const ProductList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 10px;
`;

const ProductItem = styled.li`
  background: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 6px;
  font-size: 14px;
  color: #3a5a3a;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SeeMoreButton = styled(Link)`
  display: inline-block;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #228b22, #56ab2f);
  color: white;
  border-radius: 30px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(34, 139, 34, 0.2);
  position: relative;
  overflow: hidden;
  text-align: center;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(34, 139, 34, 0.3);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%);
    transform: rotate(30deg);
    animation: ${shimmer} 3s infinite;
    pointer-events: none;
  }
`;

export const Composantrequest = ({ request }) => {
  if (!request || typeof request !== 'object' || !request._id) {
    return <div>Invalid request data.</div>;
  }

  const {
    _id,
    title,
    address,
    expirationDate,
    description,
    category,
    status,
    requestedProducts,
    numberOfMeals,
    mealName,
    mealDescription,
    mealType,
  } = request;

  return (
    <Card>
      <div>
        <Title>🛒 {title || 'Untitled Request'}</Title>
        <Details>📍 <strong>Location:</strong> {address || 'Not specified'}</Details>
        <Details>📆 <strong>Expiration:</strong> {expirationDate ? new Date(expirationDate).toLocaleDateString() : 'Not defined'}</Details>
        <Details>📝 <strong>Description:</strong> {description || 'No description'}</Details>
        <Details>📂 <strong>Category:</strong> {category || 'Not specified'}</Details>
        <Details>🔄 <strong>Status:</strong> <StatusBadge status={status}>{status || 'Unknown'}</StatusBadge></Details>

        <h4>{category === 'prepared_meals' ? '🍽️ Prepared Meals' : '📦 Requested Products:'}</h4>
        <ProductList>
          {category === 'prepared_meals' ? (
            <>
              {mealName || mealDescription || mealType ? (
                <ProductItem>
                  {mealName && (
                    <span>
                      <strong>Meal Name:</strong> {mealName}
                    </span>
                  )}
                  {mealDescription && (
                    <span>
                      <strong>Description:</strong> {mealDescription}
                    </span>
                  )}
                  {mealType && (
                    <span>
                      <strong>Type:</strong> {mealType}
                    </span>
                  )}
                  <span>
                    <strong>Number of Meals:</strong> {numberOfMeals || 'Not specified'}
                  </span>
                </ProductItem>
              ) : (
                <ProductItem>
                  <span>
                    <strong>Number of Meals:</strong> {numberOfMeals || 'Not specified'}
                  </span>
                </ProductItem>
              )}
            </>
          ) : requestedProducts && requestedProducts.length > 0 ? (
            requestedProducts.map((item, index) => (
              <ProductItem key={index}>
                <span>
                  <strong>Type:</strong> {item.product?.productType || 'Not specified'}
                </span>
                <span>
                  <strong>Weight:</strong> {item.product?.weightPerUnit || 0} {item.product?.weightUnit || ''}
                </span>
                <span>
                  <strong>Quantity:</strong> {item.quantity || 0} {item.product?.weightUnitTotale || ''}
                </span>
                <span>
                  <strong>Status:</strong> {item.product?.status || 'Unknown'}
                </span>
              </ProductItem>
            ))
          ) : (
            <ProductItem>No requested products</ProductItem>
          )}
        </ProductList>
      </div>

      <SeeMoreButton to={`/DetailsRequest/${_id}`}>See more</SeeMoreButton>
    </Card>
  );
};

export default Composantrequest;