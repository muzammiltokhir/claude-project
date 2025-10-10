"use strict";
// Swagger/OpenAPI configuration for Firebase Functions API
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUi = exports.swaggerUiOptions = exports.specs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Firebase Cloud Functions API',
            version: '1.0.0',
            description: 'A TypeScript Firebase Cloud Functions API with Express.js featuring dual authentication methods',
            contact: {
                name: 'API Support',
                email: 'support@yourcompany.com'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers: [
            {
                url: 'https://us-central1-public-api-37564.cloudfunctions.net/api',
                description: 'Production server (Firebase Functions)'
            },
            {
                url: 'https://public-api-37564.web.app',
                description: 'Production server with custom domain'
            },
            {
                url: 'http://localhost:5001/public-api-37564/us-central1/api',
                description: 'Local development server (Firebase Emulator)'
            }
        ],
        components: {
            securitySchemes: {
                FirebaseAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Firebase ID Token obtained from Firebase Authentication'
                },
                CompanyAccessCode: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-access-code',
                    description: 'Company access code stored in Firestore companies collection'
                }
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indicates if the request was successful'
                        },
                        message: {
                            type: 'string',
                            description: 'Human readable message'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data object'
                        },
                        error: {
                            type: 'string',
                            description: 'Error code (only present when success is false)'
                        }
                    },
                    required: ['success']
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            description: 'Error code'
                        },
                        message: {
                            type: 'string',
                            description: 'Error description'
                        }
                    },
                    required: ['success', 'error', 'message']
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            description: 'Firebase user UID'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        displayName: {
                            type: 'string',
                            nullable: true,
                            description: 'User display name'
                        },
                        photoURL: {
                            type: 'string',
                            nullable: true,
                            description: 'User profile photo URL'
                        },
                        emailVerified: {
                            type: 'boolean',
                            description: 'Whether email is verified'
                        },
                        phoneNumber: {
                            type: 'string',
                            nullable: true,
                            description: 'User phone number'
                        },
                        provider: {
                            type: 'string',
                            description: 'Authentication provider'
                        }
                    }
                },
                Company: {
                    type: 'object',
                    properties: {
                        companyId: {
                            type: 'string',
                            description: 'Company document ID'
                        },
                        companyName: {
                            type: 'string',
                            description: 'Company name'
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication information is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            examples: {
                                missingToken: {
                                    summary: 'Missing authorization header',
                                    value: {
                                        success: false,
                                        error: 'UNAUTHORIZED',
                                        message: 'Authorization header with Bearer token is required'
                                    }
                                },
                                invalidToken: {
                                    summary: 'Invalid token',
                                    value: {
                                        success: false,
                                        error: 'INVALID_TOKEN',
                                        message: 'Invalid ID token provided'
                                    }
                                },
                                missingAccessCode: {
                                    summary: 'Missing access code',
                                    value: {
                                        success: false,
                                        error: 'MISSING_ACCESS_CODE',
                                        message: 'x-access-code header is required'
                                    }
                                }
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: 'The requested resource was not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                success: false,
                                error: 'NOT_FOUND',
                                message: 'Route GET /api/nonexistent not found'
                            }
                        }
                    }
                },
                InternalServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                success: false,
                                error: 'INTERNAL_SERVER_ERROR',
                                message: 'An unexpected error occurred'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/index.ts'], // Path to the API files
};
exports.specs = (0, swagger_jsdoc_1.default)(options);
exports.swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Firebase Functions API Documentation',
    explorer: true,
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
};
//# sourceMappingURL=swagger.js.map