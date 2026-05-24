// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FileRegistry
 * @dev Luu hash SHA-256 va tao FileID de tra cuu.
 */
contract FileRegistry {
    struct FileRecord {
        string fileId;
        bytes32 sha256Hash;
        string fileName;
        string fileType;
        uint256 fileSize;
        address uploader;
        uint256 timestamp;
        string description;
        bool isActive;
    }

    mapping(string => FileRecord) private fileRecords;
    mapping(bytes32 => string) private hashToFileId;
    mapping(address => string[]) private uploaderFiles;

    uint256 private totalFiles;
    address public owner;

    event FileRegistered(
        string indexed fileId,
        bytes32 indexed sha256Hash,
        string fileName,
        address indexed uploader,
        uint256 timestamp
    );

    event FileDeactivated(
        string indexed fileId,
        address deactivator,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "FileRegistry: caller is not the owner");
        _;
    }

    modifier fileExists(string memory fileId) {
        require(fileRecords[fileId].isActive, "FileRegistry: file not found or inactive");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalFiles = 0;
    }

    function registerFile(
        string memory sha256HashHex,
        string memory fileName,
        string memory fileType,
        uint256 fileSize,
        string memory description
    ) external returns (string memory fileId) {
        require(bytes(sha256HashHex).length == 64, "FileRegistry: invalid SHA-256 hash length");
        require(bytes(fileName).length > 0, "FileRegistry: file name required");
        require(fileSize > 0, "FileRegistry: file size must be > 0");

        bytes32 hashBytes = _hexStringToBytes32(sha256HashHex);
        require(bytes(hashToFileId[hashBytes]).length == 0, "FileRegistry: file with this hash already registered");

        fileId = _generateFileId(hashBytes, msg.sender, block.timestamp);

        fileRecords[fileId] = FileRecord({
            fileId: fileId,
            sha256Hash: hashBytes,
            fileName: fileName,
            fileType: fileType,
            fileSize: fileSize,
            uploader: msg.sender,
            timestamp: block.timestamp,
            description: description,
            isActive: true
        });

        hashToFileId[hashBytes] = fileId;
        uploaderFiles[msg.sender].push(fileId);
        totalFiles++;

        emit FileRegistered(fileId, hashBytes, fileName, msg.sender, block.timestamp);
    }

    function getFileInfo(string memory fileId)
        external
        view
        fileExists(fileId)
        returns (
            string memory id,
            string memory sha256HashHex,
            string memory fileName,
            string memory fileType,
            uint256 fileSize,
            address uploader,
            uint256 timestamp,
            string memory description
        )
    {
        FileRecord storage rec = fileRecords[fileId];
        id = rec.fileId;
        sha256HashHex = _bytes32ToHexString(rec.sha256Hash);
        fileName = rec.fileName;
        fileType = rec.fileType;
        fileSize = rec.fileSize;
        uploader = rec.uploader;
        timestamp = rec.timestamp;
        description = rec.description;
    }

    function findFileByHash(string memory sha256HashHex) external view returns (string memory fileId) {
        require(bytes(sha256HashHex).length == 64, "FileRegistry: invalid SHA-256 hash length");
        bytes32 hashBytes = _hexStringToBytes32(sha256HashHex);
        fileId = hashToFileId[hashBytes];
    }

    function getFilesByUploader(address uploader) external view returns (string[] memory) {
        return uploaderFiles[uploader];
    }

    function deactivateFile(string memory fileId) external fileExists(fileId) {
        require(
            msg.sender == fileRecords[fileId].uploader || msg.sender == owner,
            "FileRegistry: not authorized"
        );
        fileRecords[fileId].isActive = false;
        emit FileDeactivated(fileId, msg.sender, block.timestamp);
    }

    function getTotalFiles() external view returns (uint256) {
        return totalFiles;
    }

    function _generateFileId(
        bytes32 sha256Hash,
        address uploader,
        uint256 timestamp
    ) internal pure returns (string memory) {
        bytes32 raw = keccak256(abi.encodePacked(sha256Hash, uploader, timestamp));
        bytes memory hexChars = "0123456789ABCDEF";
        bytes memory result = new bytes(16);
        for (uint256 i = 0; i < 8; i++) {
            result[i * 2] = hexChars[uint8(raw[i]) >> 4];
            result[i * 2 + 1] = hexChars[uint8(raw[i]) & 0x0f];
        }
        return string(result);
    }

    function _hexStringToBytes32(string memory hexStr) internal pure returns (bytes32 result) {
        bytes memory b = bytes(hexStr);
        require(b.length == 64, "FileRegistry: hex string must be 64 chars");
        for (uint256 i = 0; i < 32; i++) {
            uint8 high = _hexCharToUint(b[i * 2]);
            uint8 low = _hexCharToUint(b[i * 2 + 1]);
            uint8 value = (high << 4) | low;
            result |= bytes32(uint256(value) << (8 * (31 - i)));
        }
    }

    function _hexCharToUint(bytes1 c) internal pure returns (uint8) {
        if (c >= "0" && c <= "9") return uint8(c) - uint8(bytes1("0"));
        if (c >= "a" && c <= "f") return 10 + uint8(c) - uint8(bytes1("a"));
        if (c >= "A" && c <= "F") return 10 + uint8(c) - uint8(bytes1("A"));
        revert("FileRegistry: invalid hex character");
    }

    function _bytes32ToHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            result[i * 2] = hexChars[uint8(data[i]) >> 4];
            result[i * 2 + 1] = hexChars[uint8(data[i]) & 0x0f];
        }
        return string(result);
    }
}