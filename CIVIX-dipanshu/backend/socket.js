let io = null;

module.exports = {
  setIO: (serverIO) => {
    io = serverIO;
  },
  getIO: () => io,
};
