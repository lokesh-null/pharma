// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PharmaLyncCore
 * @dev Smart contract for medicine registry and dispensing with role-based access control
 */
contract PharmaLyncCore is AccessControl {
    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Medicine structure
    struct Medicine {
        uint256 id;
        string name;
        string manufacturer;
        string batchNumber;
        uint256 registeredAt;
        bool dispensed;
        address dispensedBy;
        uint256 dispensedAt;
    }

    // State variables
    uint256 private medicineCounter;
    mapping(uint256 => Medicine) public medicines;
    mapping(string => uint256) public batchNumberToId;

    // Events
    event MedicineRegistered(
        uint256 indexed medicineId,
        string name,
        string manufacturer,
        string batchNumber,
        uint256 timestamp
    );

    event MedicineDispensed(
        uint256 indexed medicineId,
        address indexed pharmacy,
        uint256 timestamp
    );

    /**
     * @dev Constructor - grants admin role to deployer
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new medicine
     * @param name Medicine name
     * @param manufacturer Manufacturer name
     * @param batchNumber Unique batch number
     * @return medicineId The ID of the registered medicine
     */
    function registerMedicine(
        string memory name,
        string memory manufacturer,
        string memory batchNumber
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(manufacturer).length > 0, "Manufacturer cannot be empty");
        require(bytes(batchNumber).length > 0, "Batch number cannot be empty");
        require(batchNumberToId[batchNumber] == 0, "Batch number already exists");

        medicineCounter++;
        uint256 medicineId = medicineCounter;

        medicines[medicineId] = Medicine({
            id: medicineId,
            name: name,
            manufacturer: manufacturer,
            batchNumber: batchNumber,
            registeredAt: block.timestamp,
            dispensed: false,
            dispensedBy: address(0),
            dispensedAt: 0
        });

        batchNumberToId[batchNumber] = medicineId;

        emit MedicineRegistered(
            medicineId,
            name,
            manufacturer,
            batchNumber,
            block.timestamp
        );

        return medicineId;
    }

    /**
     * @dev Dispense a medicine (prevents double-dispensing)
     * @param medicineId ID of the medicine to dispense
     */
    function dispenseMedicine(uint256 medicineId) external onlyRole(PHARMACY_ROLE) {
        require(medicineId > 0 && medicineId <= medicineCounter, "Invalid medicine ID");
        require(!medicines[medicineId].dispensed, "Medicine already dispensed");

        medicines[medicineId].dispensed = true;
        medicines[medicineId].dispensedBy = msg.sender;
        medicines[medicineId].dispensedAt = block.timestamp;

        emit MedicineDispensed(medicineId, msg.sender, block.timestamp);
    }

    /**
     * @dev Check if a medicine has been dispensed
     * @param medicineId ID of the medicine
     * @return bool True if dispensed, false otherwise
     */
    function isMedicineDispensed(uint256 medicineId) external view returns (bool) {
        require(medicineId > 0 && medicineId <= medicineCounter, "Invalid medicine ID");
        return medicines[medicineId].dispensed;
    }

    /**
     * @dev Get medicine details
     * @param medicineId ID of the medicine
     * @return Medicine struct
     */
    function getMedicine(uint256 medicineId) external view returns (Medicine memory) {
        require(medicineId > 0 && medicineId <= medicineCounter, "Invalid medicine ID");
        return medicines[medicineId];
    }

    /**
     * @dev Get total number of registered medicines
     * @return uint256 Total count
     */
    function getTotalMedicines() external view returns (uint256) {
        return medicineCounter;
    }
}
