/**
 * @TODO /api/v1/auth/login POST
 * */ 

/**
 * @swagger
 * /api/{version}/{service}/login:
 *   post:
 *     tags:
 *       - auth
 *     description: Responds if the app is up and running
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         default: 'v1'
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         default: 'auth'
 *     requestBody:
 *       description: Enter your account information
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Enter your email 
 *               password:
 *                 type: string
 *                 description: Enter your password
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier of the user
 *                 fullname:
 *                   type: string
 *                   description: Full name of the user
 *                 email:
 *                   type: string
 *                   description: Email address of the user
 *                 is_active:
 *                   type: boolean
 *                   description: Indicates if the user is active
 *                 avatar:
 *                   type: string
 *                   format: url
 *                   description: URL of the user's avatar
 *                 created_time:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the user was created
 *                 accessToken:
 *                   type: string
 *                   description: Access token for the user
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token for the user
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: List of roles assigned to the user 
 */

/**
 * @TODO /api/v1/auth/login-github POST
 * */ 

/**
 * @swagger
 * /api/{version}/{service}/login-github:
 *   post:
 *     tags:
 *       - auth
 *     description: Responds if the app is up and running
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         default: 'v1'
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         default: 'auth'
 *     requestBody:
 *       description: Enter your code of Github
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Enter your code of Github 
 *             required:
 *               - code
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier of the user
 *                 fullname:
 *                   type: string
 *                   description: Full name of the user
 *                 email:
 *                   type: string
 *                   description: Email address of the user
 *                 is_active:
 *                   type: boolean
 *                   description: Indicates if the user is active
 *                 avatar:
 *                   type: string
 *                   format: url
 *                   description: URL of the user's avatar
 *                 created_time:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the user was created
 *                 accessToken:
 *                   type: string
 *                   description: Access token for the user
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token for the user
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: List of roles assigned to the user 
 */

/**
 * @TODO /api/v1/auth/forgot-password POST
 * */ 

/**
 * @swagger
 * /api/{version}/{service}/login-github:
 *   post:
 *     tags:
 *       - auth
 *     description: Send new password to your email
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         default: 'v1'
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         default: 'auth'
 *     requestBody:
 *       description: Enter your email of Github
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Enter your email of Github 
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: return success or error
 *                 
 */
