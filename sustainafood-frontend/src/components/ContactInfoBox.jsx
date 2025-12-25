const ContactInfoBox = ({ icon: Icon, title, content }) => {
    return (
      <div className="contact-box">
        <Icon size={30} color="#8dc73f" />
        <div className="content">
          <h4>{title}</h4>
          <p>{content}</p>
        </div>
      </div>
    )
  }
  
  export default ContactInfoBox
  