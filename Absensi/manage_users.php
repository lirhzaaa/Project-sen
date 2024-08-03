<?php
require_once 'config.php'; 

try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $action = $_POST['action'];
    $user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;

    if ($action == 'delete') {
        if ($user_id !== null) {
            $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = :user_id");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            echo "User removed successfully";
        } else {
            echo "User ID is required";
        }
    } elseif ($action == 'delete_all') {
        $stmt = $pdo->prepare("DELETE FROM users");
        $stmt->execute();

        echo "All users deleted successfully";
    }

    exit();
}
?>
