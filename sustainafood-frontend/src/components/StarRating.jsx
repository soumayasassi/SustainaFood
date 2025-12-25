import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import styled from 'styled-components';

const StarContainer = styled.div`
  display: flex;
  gap: 5px;
`;

const Star = styled(FaStar)`
  color: ${props => (props.filled ? '#f5c518' : '#ccc')};
  cursor: ${props => (props.interactive ? 'pointer' : 'default')};
  transition: color 0.2s ease-in-out;

  &:hover {
    color: ${props => (props.interactive ? '#f5c518' : '#ccc')};
  }
`;

const StarRating = ({ rating, setRating, interactive = false }) => {
  const [hover, setHover] = useState(null);

  return (
    <StarContainer>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <Star
            key={index}
            size={20}
            filled={ratingValue <= (hover || rating)}
            interactive={interactive}
            onClick={() => interactive && setRating(ratingValue)}
            onMouseEnter={() => interactive && setHover(ratingValue)}
            onMouseLeave={() => interactive && setHover(null)}
          />
        );
      })}
    </StarContainer>
  );
};

export default StarRating;