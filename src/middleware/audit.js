const { run } = require('../../database/db');

/**
 * Creates an immutable system audit log entry
 * Member 01: Sanvidu S.D.N (IT25100618) - System Admin & Business Intelligence
 */
const logAudit = async (userId, userName, action, moduleName, details) => {
    try {
        await run(
            `INSERT INTO audit_logs (user_id, user_name, action, module_name, details, timestamp)
             VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
            [userId || 1, userName || 'System User', action, moduleName, details]
        );
    } catch (err) {
        console.error('[AUDIT_ERROR] Failed to record audit log:', err.message);
    }
};

module.exports = { logAudit };
