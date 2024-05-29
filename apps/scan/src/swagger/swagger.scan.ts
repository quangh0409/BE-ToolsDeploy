/**
 * @api /api/{version}/{service}/scan-syntax POST
 * */

/**
 * @swagger
 * /api/{version}/{service}/scan-syntax:
 *   post:
 *     tags:
 *       - scan
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
 *         default: 'scan'
 *       - in: header
 *         name: token
 *         description: accessToken
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The input code to be scanned for syntax errors
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of file dockerfile
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   column:
 *                     type: integer
 *                     description: Column number where the issue occurs
 *                   file:
 *                     type: string
 *                     description: Path to the file containing the issue
 *                   message:
 *                     type: string
 *                     description: Description of the issue
 *                   code:
 *                     type: string
 *                     description: Code representing the type of issue
 *                   line:
 *                     type: integer
 *                     description: Line number where the issue occurs
 *                   level:
 *                     type: string
 *                     description: Severity level of the issue (e.g., "warning")
 *
 */

/**
 * @api /api/{version}/{service}/scan-image POST
 * */

/**
 * @swagger
 * /api/{version}/{service}/scan-image:
 *   post:
 *     tags:
 *       - scan
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
 *         default: 'scan'
 *       - in: header
 *         name: token
 *         description: accessToken
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The input code to be scanned for syntax errors
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: The image name of image docker
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 SchemaVersion:
 *                   type: integer
 *                 CreatedAt:
 *                   type: string
 *                   format: date-time
 *                 ArtifactName:
 *                   type: string
 *                 ArtifactType:
 *                   type: string
 *                 Metadata:
 *                   type: object
 *                   properties:
 *                     OS:
 *                       type: object
 *                       properties:
 *                         Family:
 *                           type: string
 *                         Name:
 *                           type: string
 *                     ImageID:
 *                       type: string
 *                     DiffIDs:
 *                       type: array
 *                       items:
 *                         type: string
 *                     RepoTags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     RepoDigests:
 *                       type: array
 *                       items:
 *                         type: string
 *                     ImageConfig:
 *                       type: object
 *                       properties:
 *                         architecture:
 *                           type: string
 *                         created:
 *                           type: string
 *                           format: date-time
 *                         history:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               created:
 *                                 type: string
 *                                 format: date-time
 *                               created_by:
 *                                 type: string
 *                               empty_layer:
 *                                 type: boolean
 *                         os:
 *                           type: string
 *                         rootfs:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                             diff_ids:
 *                               type: array
 *                               items:
 *                                 type: string
 *                         config:
 *                           type: object
 *                           properties:
 *                             Cmd:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             Entrypoint:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             Env:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             WorkingDir:
 *                               type: string
 *                             ArgsEscaped:
 *                               type: boolean
 *                 Results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Target:
 *                         type: string
 *                       Class:
 *                         type: string
 *                       Type:
 *                         type: string
 *                       Vulnerabilities:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             VulnerabilityID:
 *                               type: string
 *                             PkgID:
 *                               type: string
 *                             PkgName:
 *                               type: string
 *                             PkgIdentifier:
 *                               type: object
 *                               properties:
 *                                 PURL:
 *                                   type: string
 *                             InstalledVersion:
 *                               type: string
 *                             FixedVersion:
 *                               type: string
 *                             Status:
 *                               type: string
 *                             Layer:
 *                               type: object
 *                               properties:
 *                                 Digest:
 *                                   type: string
 *                                 DiffID:
 *                                   type: string
 *                             SeveritySource:
 *                               type: string
 *                             PrimaryURL:
 *                               type: string
 *                             DataSource:
 *                               type: object
 *                               properties:
 *                                 ID:
 *                                   type: string
 *                                 Name:
 *                                   type: string
 *                                 URL:
 *                                   type: string
 *                             Title:
 *                               type: string
 *                             Description:
 *                               type: string
 *                             Severity:
 *                               type: string
 *                             CweIDs:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             VendorSeverity:
 *                               type: object
 *                               properties:
 *                                 nvd:
 *                                   type: integer
 *                                 redhat:
 *                                   type: integer
 *                                 ubuntu:
 *                                   type: integer
 *                             CVSS:
 *                               type: object
 *                               properties:
 *                                 nvd:
 *                                   type: object
 *                                   properties:
 *                                     V3Vector:
 *                                       type: string
 *                                     V3Score:
 *                                       type: number
 *                                       format: float
 *                                 redhat:
 *                                   type: object
 *                                   properties:
 *                                     V3Vector:
 *                                       type: string
 *                                     V3Score:
 *                                       type: number
 *                                       format: float
 *                             References:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             PublishedDate:
 *                               type: string
 *                               format: date-time
 *                             LastModifiedDate:
 *                               type: string
 *                               format: date-time
 */
