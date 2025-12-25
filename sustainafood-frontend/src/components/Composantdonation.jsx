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

const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 10px;
`;

const Item = styled.li`
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

export const Composantdonation = ({ donation }) => {
  if (!donation || typeof donation !== 'object' || !donation._id) {
    return <div>Invalid donation data.</div>;
  }

  const {
    _id,
    title,
    address,
    expirationDate,
    numberOfMeals = 0,
    products = [],
    meals = [],
    status,
  } = donation;

  return (
    <Card>
      <div>
        <Title>🛒 {title || 'Untitled Donation'}</Title>
        <Details>📍 <strong>Location:</strong> {address || 'Not specified'}</Details>
        <Details>
          📆 <strong>Expiration:</strong>{' '}
          {expirationDate ? new Date(expirationDate).toLocaleDateString() : 'Not defined'}
        </Details>
        <Details>
          🔄 <strong>Status:</strong>{' '}
          <StatusBadge status={status}>{status || 'Unknown'}</StatusBadge>
        </Details>

        {Array.isArray(products) && products.length > 0 ? (
          <>
            <h4>📦 Available Products:</h4>
            <ItemList>
              {products.slice(0, 2).map((product, index) => (
                <Item key={index}>
                  {product.product && typeof product.product === 'object' ? (
                    <>
                      <span><strong>Name:</strong> {product.product.name || 'N/A'}</span>
                      <span><strong>Type:</strong> {product.product.productType || 'N/A'}</span>
                      <span>
                        <strong>Weight:</strong>{' '}
                        {product.product.weightPerUnit
                          ? `${product.product.weightPerUnit} ${product.product.weightUnit || ''}`
                          : 'N/A'}
                      </span>
                      <span><strong>Status:</strong> {product.product.status || 'N/A'}</span>
                      <span><strong>Quantity:</strong> {product.quantity || 0}</span>
                    </>
                  ) : (
                    <span>No product data available</span>
                  )}
                </Item>
              ))}
              {products.length === 0 && <Item>No products available</Item>}
            </ItemList>
          </>
        ) : Array.isArray(meals) && meals.length > 0 ? (
          <>
            <h4>🍽️ Available Meals:</h4>
            <Details><strong>Total Quantity:</strong> {numberOfMeals}</Details>
            <ItemList>
              {meals.slice(0, 2).map((meale, index) => (
                <Item key={index}>
                  {meale.meal && typeof meale.meal === 'object' ? (
                    <>
                      <span><strong>Name:</strong> {meale.meal.mealName || 'Not specified'}</span>
                      <span><strong>Description:</strong> {meale.meal.mealDescription || 'Not specified'}</span>
                      <span><strong>Type:</strong> {meale.meal.mealType || 'Not specified'}</span>
                      <span><strong>Quantity:</strong> {meale.quantity || 0}</span>
                    </>
                  ) : (
                    <span>Invalid meal data</span>
                  )}
                </Item>
              ))}
              {meals.length === 0 && <Item>No meals available</Item>}
            </ItemList>
          </>
        ) : (
          <Item>No products or meals available</Item>
        )}
      </div>

      <SeeMoreButton to={`/DetailsDonations/${_id}`}>See More</SeeMoreButton>
    </Card>
  );
};

export default Composantdonation;