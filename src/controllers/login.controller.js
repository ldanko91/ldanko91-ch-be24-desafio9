import passport from "passport";
import { generateToken } from "../utils/jwt/jwtGenerateToken.js";
import useValidPassword from "../utils/bcrypt/bryptUseValidPassword.js";
import hasCart from '../utils/middlewares/hasCart/hasCart.js'
import { existsToken } from "../utils/jwt/jwtExistsToken.js";
import { passportCall } from "../utils/jwt/jwtPassportCall.js";
import dbUsersController from "../controllers/user.controller.js";
import ERROR_TYPES from "../handlers/errors/ErrorTypes.js";
import ERROR_CAUSES from "../handlers/errors/ErrorCauses.js";
import EErrors from "../handlers/errors/EErrors.js";
import CustomError from "../handlers/errors/CustomError.js";
const DBUsersController = new dbUsersController();

export default class loginController {

    loginGet = () => {
        existsToken, async (req, res) => {
            return res.render('login', {
                title: `Acceso de usuarios`
            })
        }
    };

    loginPost = async (req, res) => {
            const { email, password } = req.body
            
            if (!email || !password)
            return CustomError.createError({
                name: ERROR_TYPES.BAD_REQUEST_ERROR,
                cause: ERROR_CAUSES.BAD_REQUEST_ERROR,
                message: ERROR_CAUSES.BAD_REQUEST_ERROR,
                code: EErrors.BAD_REQUEST,
            })
            const user = await DBUsersController.getUserByEmail(email);
            if (!user)
            return CustomError.createError({
                name: ERROR_TYPES.INVALID_CREDENTIALS_ERROR,
                cause: ERROR_CAUSES.INVALID_CREDENTIALS_ERROR,
                message: ERROR_CAUSES.INVALID_CREDENTIALS_ERROR,
                code: EErrors.UNAUTHORIZED,
            })
            if (!useValidPassword(user, password))
            return CustomError.createError({
                name: ERROR_TYPES.INVALID_CREDENTIALS_ERROR,
                cause: ERROR_CAUSES.INVALID_CREDENTIALS_ERROR,
                message: ERROR_CAUSES.INVALID_CREDENTIALS_ERROR,
                code: EErrors.UNAUTHORIZED,
            })
            let currentCart = await hasCart(email)
            const token = await generateToken({ id: user._id, role: user.role, cartCode: currentCart._id.code });

            res.cookie('authToken', token, {
                httpOnly: true,
            }).redirect('/api/sessions/current');

    };

    currentGet = async (req, res) => {
        try {
            if (req.user.user.role === 'admin') {
                let profile = await DBUsersController.getUserById(req.user.user.id)
                let users = await DBUsersController.getAllUsers();
                return res.render('adminSection', {
                    profile, users,
                    title: `Listado de usuarios`
                });
            }

            const userId = req.user.user.id;
            let user = await DBUsersController.getCurrentUserById(userId);
            const cartCode = user.cart[0]._id.code
            res.render('userProfile', {
                user, cartCode,
                title: `Perfil de ${user.first_name} ${user.last_name}`
            });
        } catch (error) {
            res.status(500).json({ message: 'Este Internal Server Error' });
        }
    };

    registerPost = (req, res) => {
        try {
            res
                .status(201)
                .json({ status: 'Success', message: 'User has been register' })
        } catch (error) {
            res.status(500).json({ status: 'error', error: 'Internal Server Error' })
        }
    };

    logoutGet = (req, res) => {
        res.clearCookie('authToken')
        return res.redirect('/api/sessions/login');

    };

    forgotPasswordPost = async (req, res) => {
        try {
            const { email, password } = req.body
            const passwordEncrypted = createHash(password)
            await DBUsersController.updateUserByEmail({ email }, { password: passwordEncrypted })
            res.status(200).json({ status: 'Success', message: 'Password updated' })
        } catch (error) {
            res.status(500).json({ status: 'error', error: 'Internal Server Error' })
        }
    }
}