<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['attendanceFile'])) {
    $target_dir = "uploads/"; // Ensure this directory exists and is writable
    $target_file = $target_dir . basename($_FILES["attendanceFile"]["name"]);
    $allowedTypes = ['dat'];
    $fileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));
    if (!in_array($fileType, $allowedTypes)) {
        echo "Sorry, only .dat files are allowed.";
        exit();
    }

    if (move_uploaded_file($_FILES["attendanceFile"]["tmp_name"], $target_file)) {
        header("Location: process.php?file=" . urlencode($target_file));
        exit();
    } else {
        echo "Sorry, there was an error uploading your file.";
    }
}
?>
