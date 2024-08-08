// Inisialisasi flatpickr pada elemen input tanggal
document.addEventListener('DOMContentLoaded', function () {
    flatpickr('.datetimepicker', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
    });
    fetchRecords(); // Fetch records when the document is loaded
});

function fetchRecords() {
    const idFilter = document.getElementById('idFilter').value;
    const userIdFilter = document.getElementById('userIdFilter').value;
    const attendanceFilter = document.getElementById('attendanceFilter').value;
    const nameFilter = document.getElementById('nameFilter').value;
    const lateFilter = document.getElementById('lateFilter').value;

    fetch(`../fetch_records.php?id=${idFilter}&user_id=${userIdFilter}&attendance=${attendanceFilter}&name=${nameFilter}&is_late=${lateFilter}`)
        .then(response => response.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                console.log('Fetched data:', data); // Log the fetched data
                const groupedData = groupByWeek(data);
                displayRecords(groupedData);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                console.error('Response text:', text); // Log the raw response
            }
        })
        .catch(error => console.error('Error fetching records:', error));
}

function groupByWeek(records) {
    const grouped = {};
    records.forEach(record => {
        const week = getWeekOfYear(new Date(record.datetime));
        if (!grouped[week]) {
            grouped[week] = [];
        }
        grouped[week].push(record);
    });

    const uniqueRecords = {};
    Object.keys(grouped).forEach(week => {
        const weekRecords = grouped[week];
        const userMap = {};
        weekRecords.forEach(record => {
            if (!userMap[record.user_id]) {
                userMap[record.user_id] = [];
            }
            userMap[record.user_id].push(record);
        });

        Object.keys(userMap).forEach(userId => {
            const userRecords = userMap[userId];
            if (userRecords.length > 1) {
                userRecords.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
            }
            uniqueRecords[`${week}_${userId}`] = userRecords[0];
        });
    });

    return Object.values(uniqueRecords);
}

function getWeekOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000);
    const oneWeek = 604800000;
    const weekNumber = Math.ceil((diff / oneWeek) - (start.getDay() - 1) / 7);
    return weekNumber;
}

function displayRecords(data) {
    let recordsDiv = document.getElementById('records');
    let table = '<table class="table table-bordered"><tr><th>ID</th><th>User ID</th><th>Full Name</th><th>Date Time</th><th>Check Type</th><th>Attendance</th><th>Keterlambatan</th><th>Actions</th></tr>';

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "--Weekend--"];

    let groupedData = {};
    let dayIds = {}; // To keep track of IDs for each day

    data.forEach(record => {
        const date = new Date(record.datetime);
        const month = monthNames[date.getMonth()];
        const week = `Minggu ${Math.ceil(date.getDate() / 7)}`;
        const day = date.getDay() === 0 || date.getDay() === 6 ? "--Weekend--" : dayNames[date.getDay() - 1];

        if (!groupedData[month]) {
            groupedData[month] = {};
        }
        if (!groupedData[month][week]) {
            groupedData[month][week] = [];
        }
        groupedData[month][week].push({ day, record });
    });

    Object.keys(groupedData).forEach(month => {
        table += `<tr><td colspan="8" class="font-weight-bold">${month}</td></tr>`;
        let weekCount = 0;
        Object.keys(groupedData[month]).forEach(week => {
            weekCount++;
            if (weekCount > 4) return;

            table += `<tr><td colspan="8" class="font-weight-bold">${week}</td></tr>`;

            // Sort days to ensure correct weekday order
            const weekDays = dayNames.slice(0, 5); // Monday to Friday
            weekDays.forEach(dayName => {
                const recordsForDay = groupedData[month][week].filter(item => item.day === dayName);

                if (recordsForDay.length > 0) {
                    table += `<tr><td colspan="8" class="font-weight-bold">${dayName}</td></tr>`;
                    recordsForDay.forEach(item => {
                        const record = item.record;
                        const dayKey = `${month}-${week}-${dayName}`;
                        const id = dayIds[dayKey] || 1;
                        dayIds[dayKey] = id + 1;

                        let attendanceIn = record.attendance_in === '-' ? '-' : 'Present';
                        let attendanceOut = record.attendance_out === '-' ? '-' : 'Present';
                        let finalAttendance = record.datetime_out ? attendanceOut : '-';

                        let isLateIn = isLate(new Date(record.datetime));
                        let isLateOut = record.datetime_out ? '-' : '';

                        table += `<tr>
                            <td>${id}</td>
                            <td><input type="text" value="${record.user_id}" id="user_id_${record.id}_in" class="form-control"></td>
                            <td>${record.full_name}</td>
                            <td><input type="datetime-local" value="${record.datetime ? record.datetime.replace(' ', 'T') : ''}" id="datetime_${record.id}_in" class="form-control datetimepicker"></td>
                            <td>Check In</td>
                            <td>
                                <select id="attendance_${record.id}_in" class="form-control">
                                    <option value="0" ${attendanceIn === '-' ? 'selected' : ''}>-</option>
                                    <option value="1" ${attendanceIn === 'Present' ? 'selected' : ''}>Present</option>
                                    <option value="2" ${attendanceIn === 'Dispen' ? 'selected' : ''}>Dispen</option>
                                    <option value="3" ${attendanceIn === 'Sakit' ? 'selected' : ''}>Sakit</option>
                                    <option value="4" ${attendanceIn === 'Alfa' ? 'selected' : ''}>Alfa</option>
                                </select>
                            </td>
                            <td>${isLateIn}</td>
                            <td>
                                <button onclick="saveRecord(${record.id}, 'in')" class="btn btn-primary">
                                    <i class="fas fa-pen"></i> Save Change
                                </button>
                            </td>
                        </tr>`;

                        table += `<tr>
                            <td></td>
                            <td><input type="text" value="${record.user_id}" id="user_id_${record.id}_out" class="form-control"></td>
                            <td>${record.full_name}</td>
                            <td><input type="datetime-local" value="${record.datetime_out ? record.datetime_out.replace(' ', 'T') : ''}" id="datetime_${record.id}_out" class="form-control datetimepicker"></td>
                            <td>Check Out</td>
                            <td>
                                <select id="attendance_${record.id}_out" class="form-control">
                                    <option value="0" ${attendanceOut === '-' ? 'selected' : ''}>-</option>
                                    <option value="1" ${attendanceOut === 'Present' ? 'selected' : ''}>Present</option>
                                    <option value="2" ${attendanceOut === 'Dispen' ? 'selected' : ''}>Dispen</option>
                                    <option value="3" ${attendanceOut === 'Sakit' ? 'selected' : ''}>Sakit</option>
                                    <option value="4" ${attendanceOut === 'Alfa' ? 'selected' : ''}>Alfa</option>
                                </select>
                            </td>
                            <td>${isLateOut}</td>
                            <td>
                                <button onclick="saveRecord(${record.id}, 'out')" class="btn btn-primary">Save Change</button>
                            </td>
                        </tr>`;
                    });
                }
            });

            // Add weekend records if any
            const weekendRecords = groupedData[month][week].filter(item => item.day === "--Weekend--");
            if (weekendRecords.length > 0) {
                table += `<tr><td colspan="8" class="font-weight-bold">--Weekend--</td></tr>`;
                weekendRecords.forEach(item => {
                    const record = item.record;
                    const id = dayIds[`${month}-${week}--Weekend--`] || 1;
                    dayIds[`${month}-${week}--Weekend--`] = id + 1;

                    let attendanceIn = record.attendance_in === '-' ? '-' : 'Present';
                    let attendanceOut = record.attendance_out === '-' ? '-' : 'Present';
                    let finalAttendance = record.datetime_out ? attendanceOut : '-';

                    let isLateIn = isLate(new Date(record.datetime));
                    let isLateOut = record.datetime_out ? '-' : '';

                    table += `<tr>
                        <td>${id}</td>
                        <td><input type="text" value="${record.user_id}" id="user_id_${record.id}_in" class="form-control"></td>
                        <td>${record.full_name}</td>
                        <td><input type="datetime-local" value="${record.datetime ? record.datetime.replace(' ', 'T') : ''}" id="datetime_${record.id}_in" class="form-control datetimepicker"></td>
                        <td>Check In</td>
                        <td>
                            <select id="attendance_${record.id}_in" class="form-control">
                                <option value="0" ${attendanceIn === '-' ? 'selected' : ''}>-</option>
                                <option value="1" ${attendanceIn === 'Present' ? 'selected' : ''}>Present</option>
                                <option value="2" ${attendanceIn === 'Dispen' ? 'selected' : ''}>Dispen</option>
                                <option value="3" ${attendanceIn === 'Sakit' ? 'selected' : ''}>Sakit</option>
                                <option value="4" ${attendanceIn === 'Alfa' ? 'selected' : ''}>Alfa</option>
                            </select>
                        </td>
                        <td>${isLateIn}</td>
                        <td>
                            <button onclick="saveRecord(${record.id}, 'in')" class="btn btn-primary">
                                <i class="fas fa-pen"></i> Save Change
                            </button>
                        </td>
                    </tr>`;

                    table += `<tr>
                        <td></td>
                        <td><input type="text" value="${record.user_id}" id="user_id_${record.id}_out" class="form-control"></td>
                        <td>${record.full_name}</td>
                        <td><input type="datetime-local" value="${record.datetime_out ? record.datetime_out.replace(' ', 'T') : ''}" id="datetime_${record.id}_out" class="form-control datetimepicker"></td>
                        <td>Check Out</td>
                        <td>
                            <select id="attendance_${record.id}_out" class="form-control">
                                <option value="0" ${attendanceOut === '-' ? 'selected' : ''}>-</option>
                                <option value="1" ${attendanceOut === 'Present' ? 'selected' : ''}>Present</option>
                                <option value="2" ${attendanceOut === 'Dispen' ? 'selected' : ''}>Dispen</option>
                                <option value="3" ${attendanceOut === 'Sakit' ? 'selected' : ''}>Sakit</option>
                                <option value="4" ${attendanceOut === 'Alfa' ? 'selected' : ''}>Alfa</option>
                            </select>
                        </td>
                        <td>${isLateOut}</td>
                        <td>
                            <button onclick="saveRecord(${record.id}, 'out')" class="btn btn-primary">Save Change</button>
                            <button onclick="deleteRecord(${record.id})" class="btn btn-danger">Delete</button>
                        </td>
                    </tr>`;
                });
            }
        });
    });

    table += '</table>';
    recordsDiv.innerHTML = table;

    // Re-initialize flatpickr for dynamically added elements
    flatpickr('.datetimepicker', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
    });
}

function isLate(datetime) {
    const threshold = new Date(datetime);
    const checkTime = new Date(threshold.getFullYear(), threshold.getMonth(), threshold.getDate(), 9, 30, 0); // 09:30 AM
    return threshold > checkTime ? 'Late' : 'On Time';
}

function saveRecord(id, type) {
    const userId = document.getElementById(`user_id_${id}_${type}`).value;
    const datetime = document.getElementById(`datetime_${id}_${type}`).value.replace('T', ' ');
    const attendance = document.getElementById(`attendance_${id}_${type}`).value;
    
    console.log(`Saving record with ID: ${id}, Type: ${type}, DateTime: ${datetime}, Attendance: ${attendance}`);

    if (!userId || !datetime || !attendance) {
        alert('All fields must be filled.');
        return;
    }

    const formData = new FormData();
    formData.append('id', id);
    formData.append('datetime', datetime);
    formData.append('attendance', attendance);
    formData.append('type', type);

    fetch('../save_record.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(text => {
        if (text === 'success') {
            alert('Record updated successfully');
            fetchRecords(); // Refresh records after saving
        } else {
            alert('Failed to update record: ' + text);
        }
    })
    .catch(error => console.error('Error saving record:', error));
}




function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        fetch('../manage_record.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'delete',
                id: id
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Record deleted successfully');
                fetchRecords(); // Refresh records after deletion
            } else {
                alert('Delete failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}


function deleteRecords(type) {
    if (!confirm('Are you sure you want to delete all records?')) {
        return; // Exit if user cancels the action
    }

    let formData = new FormData();
    formData.append('action', 'delete_all');
    formData.append('type', type);

    fetch('../manage_records.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.status === 'success') {
                alert('All records deleted successfully.');
                fetchRecords(); // Refresh records after deletion
            } else {
                alert('Delete failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.error('Response text:', text); // Log the raw response
        }
    })
    .catch(error => console.error('Error:', error));
}
