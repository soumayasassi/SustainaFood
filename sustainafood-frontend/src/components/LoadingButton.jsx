"use client"

const LoadingButton = ({ isLoading, onClick, children, className, type = "button" }) => {
  return (
    <button type={type} onClick={onClick} disabled={isLoading} className={className || "submit-button"}>
      {isLoading ? (
        <>
          <span className="loading-spinner"></span>
          Sending...
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default LoadingButton
