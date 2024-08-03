<?php
require_once 'config.php'; 

// Establish Database Connection
try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

// Fetch Records
$id = isset($_GET['id']) ? $_GET['id'] : null; // Add filter for ID
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null; // Add filter for user ID
$attendance = isset($_GET['attendance']) ? $_GET['attendance'] : null; // Add filter for attendance status
$name = isset($_GET['name']) ? $_GET['name'] : null; // Add filter for name
$is_late = isset($_GET['is_late']) ? $_GET['is_late'] : null; // Add filter for is_late
$attendance_type = isset($_GET['attendance_type']) ? $_GET['attendance_type'] : null; // Add filter for attendance type

// Attendance Mapping 
$attendanceMapping = [ // Separate mapping for attendance status
    null => 'Absent', // Map null to 'Absent'
    '0' => 'Absent', // Map '0' to 'Absent'
    '1' => 'Present', // Add mapping for fingerprint
    '16' => 'Present' // Add mapping for face recognition
];

$attendanceTypeMapping = [ // Separate mapping for attendance type
    '1' => 'Fingerprint', // Map '1' to 'Fingerprint'
    '16' => 'Face Recognition' // Map '16' to 'Face Recognition'
];

// Query Construction
$query = 'SELECT ar.*, u.full_name FROM attendance_records ar 
          JOIN users u ON ar.user_id = u.user_id WHERE 1=1';
$params = [];

// Add filters to query based on parameters
if ($id !== null && $id !== '') {
    $query .= ' AND ar.id = :id';
    $params[':id'] = $id;
}

if ($user_id !== null && $user_id !== '') {
    $query .= ' AND ar.user_id LIKE :user_id';
    $params[':user_id'] = '%' . $user_id . '%';
}

if ($attendance !== null && $attendance !== '') {
    $query .= ' AND ar.attendance = :attendance';
    $params[':attendance'] = $attendance; 
}

if ($name !== null && $name !== '') {
    $query .= ' AND u.full_name LIKE :name';
    $params[':name'] = '%' . $name . '%';
}

if ($is_late !== null) {
    $query .= ' AND ar.is_late = :is_late';
    $params[':is_late'] = $is_late;
}

if ($attendance_type !== null) {
    $query .= ' AND ar.attendance_type = :attendance_type';
    $params[':attendance_type'] = $attendance_type;
}

// Execute Query with Prepared Statement
$stmt = $pdo->prepare($query);
error_log("Query: $query");
error_log("Params: " . json_encode($params));

// Check if query execution is successful
if (!$stmt->execute($params)) {
    error_log("Error executing query: " . json_encode($stmt->errorInfo()));
    http_response_code(500); // Send an internal server error response
    echo json_encode(["error" => "An error occurred while fetching data."]);
    exit();
}

$records = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch all records
error_log("Fetched records: " . json_encode($records)); // Log fetched records

// Translate attendance status back to keywords for display
foreach ($records as &$record) {
    $record['attendance'] = $attendanceMapping[$record['attendance']] ?? 'Unknown'; 
    $record['attendance_type'] = $attendanceTypeMapping[$record['attendance_type']] ?? 'Unknown'; // Translate attendance type
}

header('Content-Type: application/json');
echo json_encode($records);
?>
