<?php

require_once 'config.php';

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : null;
    $id = isset($_POST['id']) ? intval($_POST['id']) : null;

    if ($action === 'edit') {
        $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;
        $datetime = isset($_POST['datetime']) ? $_POST['datetime'] : null;
        $attendance = isset($_POST['attendance']) ? $_POST['attendance'] : null;
        $check_type = isset($_POST['check_type']) ? $_POST['check_type'] : null;
        $attendance_type = isset($_POST['attendance_type']) ? $_POST['attendance_type'] : null;

        if ($id && $user_id && $datetime && $attendance && $check_type && $attendance_type) {
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
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Missing parameters']);
        }
    } elseif ($action === 'delete') {
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM attendance_records WHERE id = :id");
                $stmt->bindParam(':id', $id);
                $stmt->execute();

                echo json_encode(['status' => 'success', 'message' => 'Record deleted successfully']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Deletion failed: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
