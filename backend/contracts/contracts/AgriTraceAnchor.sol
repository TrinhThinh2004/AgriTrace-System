// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgriTraceAnchor
 * @notice Smart contract neo (anchor) Merkle root của các lô audit log off-chain
 *         cho hệ thống truy xuất nguồn gốc AgriTrace. Mỗi anchor cam kết một
 *         dải seq_no liên tiếp của audit_logs thông qua một Merkle root
 *         được tính ở off-chain (audit-service).
 *
 * Mô hình tấn công (threat model):
 *   Chống lại trường hợp insider có quyền truy cập DB cố tình sửa audit log.
 *   Một khi anchor đã được mine vào block, bất kỳ thay đổi nào tới record_hash
 *   trong khoảng [fromSeq, toSeq] sẽ tạo ra Merkle root khác — không còn khớp
 *   với root đã lưu on-chain → phát hiện tampering ngay lập tức.
 *
 * Chỉ owner (ví của audit-service deployer) mới được phép ghi anchor.
 * Anchor là append-only: KHÔNG có hàm update hay delete.
 */
contract AgriTraceAnchor {
    /// @notice Cấu trúc của một anchor record được lưu on-chain.
    struct Anchor {
        bytes32 merkleRoot;   // Merkle root keccak256 của các record_hash trong dải
        uint256 fromSeq;      // seq_no đầu (inclusive) của audit_logs trong dải này
        uint256 toSeq;        // seq_no cuối (inclusive) của audit_logs trong dải này
        uint256 timestamp;    // block.timestamp khi anchor được lưu
    }

    /// @notice Danh sách anchor on-chain, key là id tăng dần đơn điệu (bắt đầu từ 1).
    mapping(uint256 => Anchor) public anchors;

    /// @notice ID của anchor cuối cùng đã lưu. Bằng 0 ngay sau khi deploy.
    uint256 public lastAnchorId;

    /// @notice Địa chỉ ví được quyền ghi anchor (ví audit-service).
    address public owner;

    /// @notice Phát ra mỗi khi 1 anchor mới được lưu thành công.
    event AnchorStored(
        uint256 indexed anchorId,
        bytes32 merkleRoot,
        uint256 fromSeq,
        uint256 toSeq,
        address indexed by
    );

    /// @notice Phát ra khi quyền owner được chuyển sang ví mới.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Lỗi: caller không phải là owner hiện tại.
    error NotOwner();
    /// @notice Lỗi: dải seq_no không hợp lệ (toSeq < fromSeq).
    error InvalidRange();
    /// @notice Lỗi: Merkle root rỗng (bytes32(0)).
    error InvalidRoot();
    /// @notice Lỗi: địa chỉ truyền vào là zero address.
    error InvalidAddress();

    /// @dev Modifier kiểm tra caller phải là owner hiện tại.
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Khi deploy, owner được set thành ví đã thực hiện deploy.
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Lưu một anchor mới cam kết audit logs trong khoảng [fromSeq, toSeq].
     * @dev Chỉ owner gọi được. Anchor id tăng dần đơn điệu, bắt đầu từ 1.
     * @param root Merkle root keccak256 tính từ các record_hash leaves (tính ở off-chain).
     * @param fromSeq seq_no đầu (inclusive) của dải audit_logs.
     * @param toSeq seq_no cuối (inclusive) của dải audit_logs.
     * @return anchorId ID mới được gán cho anchor vừa lưu.
     */
    function storeAnchor(bytes32 root, uint256 fromSeq, uint256 toSeq)
        external
        onlyOwner
        returns (uint256 anchorId)
    {
        if (root == bytes32(0)) revert InvalidRoot();
        if (toSeq < fromSeq) revert InvalidRange();
        unchecked { lastAnchorId += 1; }
        anchorId = lastAnchorId;
        anchors[anchorId] = Anchor({
            merkleRoot: root,
            fromSeq: fromSeq,
            toSeq: toSeq,
            timestamp: block.timestamp
        });
        emit AnchorStored(anchorId, root, fromSeq, toSeq, msg.sender);
    }

    /**
     * @notice Đọc thông tin của 1 anchor theo id.
     * @param anchorId ID của anchor cần đọc.
     * @return Cấu trúc Anchor chứa merkleRoot, fromSeq, toSeq, timestamp.
     */
    function getAnchor(uint256 anchorId) external view returns (Anchor memory) {
        return anchors[anchorId];
    }

    /**
     * @notice Chuyển quyền owner sang ví khác.
     * @dev Chỉ owner hiện tại gọi được. Ví mới không được là zero address.
     * @param newOwner Địa chỉ ví mới sẽ trở thành owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
