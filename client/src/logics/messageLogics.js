const isOwnMessage = (sender, userId) => {
  return sender._id === userId;
};

const isUsersLastMessage = (messages, index, message) => {
  return message?.sender._id === messages[index + 1]?.sender._id;
};

const chatPhotoHandler = (singleChat, user) => {
  return singleChat?.users[0]._id === user?._id
    ? singleChat?.users[1].photoURL
    : singleChat?.users[0].photoURL;
};

export { isOwnMessage, isUsersLastMessage, chatPhotoHandler };
