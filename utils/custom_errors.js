class NoSuchShaError extends Error {
    constructor(sha) {
      super(`Couldn't find a commit with sha ${sha}`);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
}

class MalformedTheoryPathsError extends Error {
    constructor(sha) {
      super(`Couldn't open and read one or more theory paths extracted from the commit message.`);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    NoSuchShaError,
    MalformedTheoryPathsError
};