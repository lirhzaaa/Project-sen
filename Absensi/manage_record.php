<?php

require_once 'config.php'; 

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $action = $_POST['action'];
    $id = isset($_POST['id']) ? intval($_POST['id']) : null;

    if ($action == 'edit') {
        $user_id = $_POST['user_id'];
        $datetime = $_POST['datetime'];
        $attendance = $_POST['attendance']; 
        $check_type = $_POST['check_type'];
        $attendance_type = $_POST['attendance_type'];

        try {
            $stmt = $pdo->prepare("UPDATE attendance_records SET user_id = :user_id, datetime = :datetime, attendance = :attendance, check_type = :check_type, attendance_type = :attendance_type WHERE id = :id");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':datetime', $datetime);
            $stmt->bindParam(':attendance', $attendance);
            $stmt->bindParam(':check_type', $check_type);
            $stmt->bindParam(':attendance_type', $attendance_type);
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            echo json_encode(['status' => 'success', 'message' => 'Record updated successfully']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Update failed: ' . $e->getMessage()]);
        }
    } elseif ($action == 'delete') {
        try {
            $stmt = $pdo->prepare("DELETE FROM attendance_records WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            echo json_encode(['status' => 'success', 'message' => 'Record deleted successfully']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Deletion failed: ' . $e->getMessage()]);
        }
    }  else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
    exit();
}
?>