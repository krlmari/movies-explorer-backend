const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

require("dotenv").config();

const NotFoundError = require("../errors/not-found-err");
const IncorrectError = require("../errors/incorrect-err");
const AuthError = require("../errors/auth-err");

const { NODE_ENV, JWT_SECRET } = process.env;

const getUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError("Запрашиваемый пользователь не найден.");
      }

      const data = { _id: user._id, email: user.email, name: user.name };
      res.send(data);
    })
    .catch(next);
};

const updateUser = (req, res, next) => {
  const { email, name } = req.body;

  User.findByIdAndUpdate(req.user._id, { email, name })
    .then((newUser) => res.send({ data: newUser }))
    .catch(() => {
      throw new IncorrectError(
        "Некорректные данные для обновления пользователя."
      );
    })
    .catch(next);
};

const createUser = (req, res, next) => {
  const { email, name } = req.body;
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) =>
      User.create({
        email,
        name,
        password: hash,
      })
    )
    .then((user) => res.send({ data: user }))
    .catch(() => {
      throw new IncorrectError(
        "Некорректные данные для создания нового пользователя."
      );
    })
    .catch(next);
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === "production" ? JWT_SECRET : "dev-secret"
      );
      res.send({ token });
    })
    .catch(() => {
      throw new AuthError("Некорректные почта и/или пароль.");
    })
    .catch(next);
};

module.exports = {
  getUser,
  updateUser,
  createUser,
  login,
};
