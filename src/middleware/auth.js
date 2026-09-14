const { get } = require('../../database/db');

/**
 * Authentication and RBAC Middleware
 * Member 01: Sanvidu S.D.N (IT25100618)
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role'] || 'Admin'; // Default to active persona
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: `Access Denied: Role '${userRole}' is not authorized to access this resource.`
            });
        }
        next();
    };
};

const checkPermission = (moduleName, action = 'read') => {
    return async (req, res, next) => {
        const userRole = req.headers['x-user-role'] || 'Admin';
        const column = `can_${action.toLowerCase()}`;

        try {
            const perm = await get(
                `SELECT ${column} FROM role_permissions WHERE role_name = ? AND module_name = ?`,
                [userRole, moduleName]
            );

            if (perm && perm[column] === 1) {
                return next();
            }

            // Admins bypass unless strictly locked
            if (userRole === 'Admin') {
                return next();
            }

            return res.status(403).json({
                success: false,
                error: `RBAC Violation: Role '${userRole}' lacks permission '${action}' on module '${moduleName}'.`
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    };
};

module.exports = { requireRole, checkPermission };
