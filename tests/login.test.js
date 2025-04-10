const { Builder, By, until } = require('selenium-webdriver');
const xlsx = require('xlsx');
require('chromedriver');

// Đọc dữ liệu từ file Excel
const workbook = xlsx.readFile('test_data_login.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const testData = xlsx.utils.sheet_to_json(sheet);

// Kết quả test
let results = [];

(async function runTests() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        for (let data of testData) {
            console.log(`Testing login with email: ${data.email}, password: ${data.password}`);
            
            await driver.get('http://localhost:3001/login');
            await driver.wait(until.elementLocated(By.name('email')), 10000);
            
            if (data.email) await driver.findElement(By.name('email')).sendKeys(data.email);
            if (data.password) await driver.findElement(By.name('password')).sendKeys(data.password);
            
            await driver.findElement(By.css('button[type="submit"]')).click();
            
            try {
                await driver.wait(until.urlIs('http://localhost:3001/home'), 5000);
                if (data.expected_result === 'successfully') {
                    console.log('✅ Login success as expected');
                    results.push({ ...data, actual_result: 'successfully', status: 'PASSED' });
                } else {
                    console.log('❌ Unexpected success');
                    results.push({ ...data, actual_result: 'successfully', status: 'FAILED' });
                }
            } catch (error) {
                console.log('❌ Login failed');
                if (data.expected_result === 'failed') {
                    results.push({ ...data, actual_result: 'failed', status: 'PASSED' });
                } else {
                    results.push({ ...data, actual_result: 'failed', status: 'FAILED' });
                }
            }
        }
    } catch (err) {
        console.error('Error during login tests:', err);
    } finally {
        await driver.quit();
        
        // Ghi kết quả ra file Excel
        const resultSheet = xlsx.utils.json_to_sheet(results);
        const resultWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(resultWorkbook, resultSheet, 'Login Test Results');
        xlsx.writeFile(resultWorkbook, 'test_login_report.xlsx');

        console.log('Test results saved to test_login_report.xlsx');
    }
})();
