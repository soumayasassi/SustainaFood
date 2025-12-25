"use client"

import { useState, useEffect, useRef } from "react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SpeechButton from "../components/SpeechButton"
import "../assets/styles/Contact.css"
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from "react-icons/fa"
import { submitContactForm } from "../api/contactService"
import LoadingButton from "../components/LoadingButton"
import ContactInfoBox from "../components/ContactInfoBox"

const Contact = () => {
  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    comment: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageText, setPageText] = useState("")
  const contentRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFeedback({ ...feedback, [name]: value })
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Form validation
    if (!feedback.name.trim()) {
      setError("Please enter your name")
      return
    }

    if (!feedback.email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!validateEmail(feedback.email)) {
      setError("Please enter a valid email address")
      return
    }

    if (!feedback.comment.trim()) {
      setError("Please enter your message")
      return
    }

    setLoading(true)

    try {
      await submitContactForm(feedback)
      setSubmitted(true)
      setError(null)
      setFeedback({ name: "", email: "", comment: "" }) // Reset form
    } catch (err) {
      setError(err.message || "Failed to submit the form. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: "Address",
      content: "Pôle Technologique El Ghazela, Ariana Tunis",
    },
    {
      icon: FaPhone,
      title: "Phone",
      content: "+216 123 456 789",
    },
    {
      icon: FaEnvelope,
      title: "Email",
      content: "Ssustainafood@gmail.com",
    },
    {
      icon: FaClock,
      title: "Working Hours",
      content: "Mon - Fri: 9 AM - 6 PM",
    },
  ]

  useEffect(() => {
    const collectText = () => {
      const wrapper = contentRef.current
      if (!wrapper) {
        console.warn("Content container not found")
        return
      }

      const textNodes = []
      const walk = document.createTreeWalker(
        wrapper,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (
              node.parentElement.tagName === "SCRIPT" ||
              node.parentElement.tagName === "STYLE" ||
              node.parentElement.tagName === "IMG" ||
              node.parentElement.tagName === "IFRAME" ||
              node.parentElement.tagName === "INPUT" ||
              node.parentElement.tagName === "TEXTAREA" ||
              node.parentElement.classList.contains("error-message") ||
              node.parentElement.classList.contains("feedback-success")
            ) {
              return NodeFilter.FILTER_REJECT
            }
            return NodeFilter.FILTER_ACCEPT
          },
        }
      )

      let node
      while ((node = walk.nextNode())) {
        let text = node.textContent.trim()
        if (!text) continue
        text = text
          .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // Remove emojis
          .replace(/[^\w\s.,!?]/g, '') // Remove special characters
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove invisible characters
          .replace(/[\n\r\t]+/g, ' ') // Replace newlines and tabs
          .replace(/\.+/g, '.') // Normalize periods
          .replace(/,+/, ',') // Normalize commas
          .replace(/!+/, '!') // Normalize exclamation marks
          .replace(/\?+/, '?') // Normalize question marks
          .replace(/\s*[.,!?]\s*/g, '$&. ') // Ensure single space after punctuation
          .replace(/(\w)\1{2,}/g, '$1$1') // Limit repeated characters
          .trim()
        if (text) textNodes.push(text)
      }

      const finalText = textNodes.join('. ')
      console.log("Collected text (length:", finalText.length, "):", finalText.substring(0, 200) + (finalText.length > 200 ? "..." : ""))
      setPageText(finalText)
    }

    collectText()
  }, [submitted]) // Re-collect text when form submission state changes

  return (
    <>
      <Navbar />
      <div className="contact-page" ref={contentRef}>
        <h2 className="contact-title">Get In Touch</h2>
        <div className="contact-message">
          Have a question, a suggestion, or need assistance? We're here to help! Whether you're looking for support,
          partnership opportunities, or more information about our services, feel free to reach out. Our team will
          respond as soon as possible.
        </div>

        <div className="contact-container">
          <div className="contact-info">
            {contactInfo.map((info, index) => (
              <ContactInfoBox key={index} icon={info.icon} title={info.title} content={info.content} />
            ))}
          </div>

          <div className="feedback-form-container">
            <h3>Leave a message</h3>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="feedback-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={feedback.name}
                  onChange={handleChange}
                  aria-label="Your Name"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={feedback.email}
                  onChange={handleChange}
                  aria-label="Your Email"
                />
                <textarea
                  name="comment"
                  placeholder="Your Message"
                  value={feedback.comment}
                  onChange={handleChange}
                  aria-label="Your Message"
                  rows="5"
                />

                <LoadingButton isLoading={loading} type="submit">
                  Send Message
                </LoadingButton>

                {error && <p className="error-message">{error}</p>}
              </form>
            ) : (
              <div className="feedback-success">
                <p>Thank you for your message, {feedback.name || "Visitor"}!</p>
                <p>We've received your inquiry and will get back to you as soon as possible.</p>
                <button onClick={() => setSubmitted(false)}>Send Another Message</button>
              </div>
            )}
          </div>
        </div>

        <div className="contact-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.329763530718!2d10.1772!3d36.8760!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12d347f3d5b8d4d5%3A0x3a8d6db8ed2f31b0!2sAriana+Soghra!5e0!3m2!1sen!2stn!4v1622064481553"
            width="100%"
            alt="SustainaFood Location"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="SustainaFood Location"
            aria-label="Google Maps showing SustainaFood location"
          />
        </div>
      </div>
      <SpeechButton textToRead={pageText} position="right" />
      <Footer />
    </>
  )
}

export default Contact