// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PharmaLyncAudit
 * @dev Permissioned audit ledger for critical healthcare actions
 * Stores only hashes (no PII) for tamper-proof audit trail
 */
contract PharmaLyncAudit is Ownable {
    // Audit record structure
    struct AuditRecord {
        string auditId;
        string action;
        string dataHash; // SHA-256 hash of audit data
        uint256 timestamp;
        address actor;
        bool exists;
    }

    // State variables
    mapping(string => AuditRecord) public auditRecords;
    mapping(address => bool) public authorizedLoggers;
    uint256 public totalAudits;

    // Events
    event AuditLogged(
        string indexed auditId,
        string action,
        string dataHash,
        uint256 timestamp,
        address indexed actor
    );

    event LoggerAuthorized(address indexed logger);
    event LoggerRevoked(address indexed logger);

    /**
     * @dev Constructor - sets deployer as owner
     */
    constructor() Ownable(msg.sender) {
        // Owner is automatically authorized
        authorizedLoggers[msg.sender] = true;
    }

    /**
     * @dev Modifier to restrict access to authorized loggers
     */
    modifier onlyAuthorized() {
        require(authorizedLoggers[msg.sender], "Not authorized to log audits");
        _;
    }

    /**
     * @dev Authorize an address to log audits
     * @param logger Address to authorize
     */
    function authorizeLogger(address logger) external onlyOwner {
        require(logger != address(0), "Invalid logger address");
        require(!authorizedLoggers[logger], "Logger already authorized");

        authorizedLoggers[logger] = true;
        emit LoggerAuthorized(logger);
    }

    /**
     * @dev Revoke logger authorization
     * @param logger Address to revoke
     */
    function revokeLogger(address logger) external onlyOwner {
        require(authorizedLoggers[logger], "Logger not authorized");

        authorizedLoggers[logger] = false;
        emit LoggerRevoked(logger);
    }

    /**
     * @dev Log an audit record (hash-only, no PII)
     * @param auditId Unique audit identifier
     * @param action Action performed (e.g., "VIEW_AADHAAR")
     * @param dataHash SHA-256 hash of audit data
     * @param timestamp Timestamp of the action
     */
    function logAudit(
        string memory auditId,
        string memory action,
        string memory dataHash,
        uint256 timestamp
    ) external onlyAuthorized {
        require(bytes(auditId).length > 0, "Audit ID cannot be empty");
        require(bytes(action).length > 0, "Action cannot be empty");
        require(bytes(dataHash).length == 64, "Invalid hash length (must be 64 hex chars)");
        require(!auditRecords[auditId].exists, "Audit ID already exists");

        auditRecords[auditId] = AuditRecord({
            auditId: auditId,
            action: action,
            dataHash: dataHash,
            timestamp: timestamp,
            actor: msg.sender,
            exists: true
        });

        totalAudits++;

        emit AuditLogged(auditId, action, dataHash, timestamp, msg.sender);
    }

    /**
     * @dev Verify an audit record
     * @param auditId Audit identifier to verify
     * @return action Action performed
     * @return dataHash Hash of audit data
     * @return timestamp Timestamp of action
     * @return actor Address that logged the audit
     */
    function verifyAudit(string memory auditId)
        external
        view
        returns (
            string memory action,
            string memory dataHash,
            uint256 timestamp,
            address actor
        )
    {
        require(auditRecords[auditId].exists, "Audit record not found");

        AuditRecord memory record = auditRecords[auditId];
        return (record.action, record.dataHash, record.timestamp, record.actor);
    }

    /**
     * @dev Check if an audit record exists
     * @param auditId Audit identifier
     * @return bool True if exists, false otherwise
     */
    function auditExists(string memory auditId) external view returns (bool) {
        return auditRecords[auditId].exists;
    }

    /**
     * @dev Get total number of audit records
     * @return uint256 Total count
     */
    function getTotalAudits() external view returns (uint256) {
        return totalAudits;
    }
}
