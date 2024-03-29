import { PaperAirplaneIcon, PhotoIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { useState } from "react";
import useAuthProvider from "../hooks/useAuthProvider";

import useSocketProvider from "../hooks/useSocketProvider";
import useOnlineStatus from "../hooks/useOnlineStatus";
import useTheme from "../hooks/useTheme";

const SendMessage = ({ chat }) => {
  const { user } = useAuthProvider();
  const { dark } = useTheme();
  const { online } = useOnlineStatus();
  const [message, setMessage] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  const { socket } = useSocketProvider();
  const inputStyle = `input input-bordered focus:outline-0 focus:border-[1.3px] ${
    dark ? "focus:border-white" : "focus:border-black"
  }  input-sm w-full`;

  // input change handler
  const handleInputChange = (e) => {
    setMessage(e.target.value);

    const typingUser = chat?.users.find((u) => u._id === user?._id);

    socket?.emit("typingStatus", {
      user: typingUser,
      isTyping: true,
      chatId: chat?._id,
    });
  };

  const sendMessageHandler = async () => {
    if (!online || !message) return;
    const messageToSend = {
      content: message,
      chatId: chat?._id,
    };

    // sending to DB
    try {
      setMessageSending(true);
      const result = await axios.post("/api/message/newMessage", messageToSend);
      console.log(result.data);
      // sending message to socket
      socket?.emit("sendMessage", result?.data);

      // setMessages([...messages, result.data]);
      setMessage("");
      setMessageSending(false);
    } catch (error) {
      setMessageSending(false);
      if (
        error.response &&
        (error.response.status === 400 || error.response.status === 401)
      ) {
        // console.log(error.response.data.message);
        throw new Error(error.response.data.message);
      } else {
        // console.log(error);
        throw new Error("Something went wrong");
      }
    }
  };

  return (
    <div className=" flex items-center  gap-2 lg:px-3 mb-2">
      <span>
        <PhotoIcon
          className={`w-7 h-7  active:scale-90 transition-transform duration-700 ${
            dark ? "white" : "text-slate-600"
          }`}
        />
      </span>
      <input
        type="text"
        placeholder="Send message"
        className={`${inputStyle} ${!chat && "input-disabled"}`}
        value={message}
        name="messageInput"
        onChange={handleInputChange}
      />

      <button disabled={!chat || messageSending} onClick={sendMessageHandler}>
        <PaperAirplaneIcon
          className={`w-7 h-7  active:scale-90 transition-transform duration-700 ${
            dark ? "white" : "text-slate-600"
          }`}
        />
      </button>
    </div>
  );
};

export default SendMessage;
