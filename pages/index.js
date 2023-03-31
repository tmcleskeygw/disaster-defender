import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import reactStringReplace from 'react-string-replace';
import styles from '../styles/Home.module.css'
import Image from 'next/image'
//maybe add markdown to the other text
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import Particles from "react-particles";
import { loadConfettiPreset } from "tsparticles-preset-confetti";

export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [claimCreated, setClaimCreated] = useState(false);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  useEffect(() => {
    initMessages();
  }, []);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, [loading]);

  // Handle errors
  const handleError = () => {
    console.log("Error")
    setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: "Oops! There seems to be an error. Please try again." }]);
    setLoading(false);
    setUserInput("");
  }

  const onImageChange = async (event) => {
    if (event.target.files && event.target.files[0]) {

      const images = Object.values(event.target.files).map(file => URL.createObjectURL(file));

      setUserInput("");
      setLoading(true);

      const context = [...messages, { role: "user", content: "IMAGESTOUPLOAD", images }];
      setMessages(context);

      // Send chat history to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: context }),
      });

      const data = await response.json();

      if (!data) {
        handleError();
        return;
      }

      setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: data.result }]);
      setLoading(false);
    }
  };

  const initMessages = async () => {

    setLoading(true);

    // Send chat history to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(null),
    });

    const data = await response.json();

    if (!data) {
      handleError();
      return;
    }

    setMessages((prevMessages) => [{ role: "assistant", content: data.result }]);
    setLoading(false);
    textAreaRef.current?.focus();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const input_str = userInput.trim()

    if (input_str === "") {
      return;
    }

    // Reset user input
    setUserInput("");
    setLoading(true);

    const context = [...messages, { role: "user", content: input_str }];
    setMessages(context);

    // Send chat history to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: context }),
    });

    const data = await response.json();

    if (!data) {
      handleError();
      return;
    }

    setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: data.result }]);
    setLoading(false);
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  //get the google maps link for the given location
  const getLink = (location) => {
    console.log('location: ' + location)
    if (location === 'Roblox Building') {
      return 'https://www.google.com/maps/dir//970+Park+Pl,San+Mateo,+CA+94403';
    } else if (location === 'Whole Foods') {
      return 'https://www.google.com/maps/dir//1010+Park+Pl,San+Mateo,+CA+94403';
    } else {
      return 'https://www.google.com/maps/dir//1221+Chess+Dr,Foster+City,+CA+94403';
    }
  }

  const formatContent = (message, isLatestMessage) => {
    let { role, content, images } = message;
    if (role === "assistant") {

      //If claim has been filed:
      //TODO: don't hardcode this
      if (content === 'Your claim has been filed, and your claim number is 356-71-1234. Thank you. A field inspector will be in your area soon.' && !claimCreated) {
        setClaimCreated(true);
      }

      content = reactStringReplace(content, "https://guidewire_fake.com", (match, i) => {
        return (
          <span className="btn-file" title="">
            Select <input type="file" accept="image/*" multiple onChange={onImageChange} disabled={!isLatestMessage} />
          </span>
        )
      });

      // Remove << and >> and capitalize and turn into google maps link
      content = reactStringReplace(content, /"?<<([a-zA-Z\s]+)>>"?/, (match, i) => {
        const capitalizedLocation = match.split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return (<a href={getLink(match)}>{capitalizedLocation}</a>);
      });
    } else {
      //format images
      if (images) {
        return (
          <div className={styles.imagesContainer}>
            {Object.values(images).map((image, index) => {
              return (
                <div key={index} className={styles.container}>
                  <img src={image} alt="preview" className={styles.claimImage} />
                </div>
              )
            })
            }
          </div>
        )
      }
    }
    return content;
  }

  const customInit = async (engine) => {
    await loadConfettiPreset(engine);
  }

  const options = {
    preset: "confetti",
  };

  return (
    <>
      <Head>
        <title>Frontier Insurance - Disaster Defender</title>
        <meta name="description" content="GPT-4 interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <Image src="/frontier_insurance.jpg" width="150" height="168" alt="logo for fake insurance company" />
          <a href="/">Disaster Defender</a>

        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => {
              return (
                // The latest message sent by the user will be animated while waiting for a response
                <div key={index} className={message.role === "user" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.role === "assistant" ? styles.apimessage : styles.usermessage}>
                  {/* Display the correct icon depending on the message type */}
                  {message.role === "assistant" ? <Image src="/frontier_insurance_small.png" alt="AI" width="50" height="50" className={styles.boticon} priority={true} /> : <Image src="/usericon.png" alt="Me" width="30" height="33" className={styles.usericon} priority={true} />}
                  <div className={styles.markdownanswer}>
                    {/* Messages are being rendered in Markdown format */}
                    <div>
                      {formatContent(message, index === messages.length - 1)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {claimCreated && <Particles options={options} init={customInit} />}
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                autoFocus={false}
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                rows={1}
                maxLength={512}
                type="text"
                id="userInput"
                placeholder={loading ? "Waiting for Frontier Insurance..." : "Your response here..."}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
              >
                {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
                  // Send icon SVG in input field
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>}
              </button>
            </form>
          </div>
          <div className={styles.footer}>
            <p>Created by<br />
              <Image src="/calamity_contingent_meme.jpeg" width="150" height="150" alt="epic hackathon collective" />
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
