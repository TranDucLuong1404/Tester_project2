const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const XLSX = require('xlsx');
const path = require('path');

(async function testRegister() {
    let driver = null;
    const reportData = []; // Array to store results for the report

    try {
        // Initialize the WebDriver
        driver = await new Builder().forBrowser('chrome').build();

        // Read data from the Excel file
        const excelFilePath = path.join(__dirname, 'test_data_register.xlsx');
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet); // Convert sheet to JSON array

        // Loop through each row in the Excel file
        for (const row of data) {
            // Handle undefined or empty values by converting them to empty strings
            const username = row.username || '';
            const email = row.email || '';
            const password = row.password || '';
            const expectedResult = row.expected_result || '';

            console.log(`Testing with: ${username}, ${email}, ${password}`);

            // 1. Open the registration page
            await driver.get('http://localhost:3001/register');

            // 2. Wait for the username field to ensure the page has loaded
            await driver.wait(until.elementLocated(By.name('username')), 10000);

            // 3. Clear the form fields before entering new data (to avoid stale data)
            await driver.findElement(By.name('username')).clear();
            await driver.findElement(By.name('email')).clear();
            await driver.findElement(By.name('password')).clear();

            // 4. Fill in the form with data from Excel
            await driver.findElement(By.name('username')).sendKeys(username);
            await driver.findElement(By.name('email')).sendKeys(email);
            await driver.findElement(By.name('password')).sendKeys(password);

            // 5. Click the register button
            await driver.findElement(By.css('button[type="submit"]')).click();

            let actualResult = '';
            let status = '';

            // 6. Check the result based on the expected outcome
            if (expectedResult.includes('hợp lệ')) {
                // Case: Expecting a successful registration (redirect to login page)
                try {
                    await driver.wait(until.urlIs('http://localhost:3001/login'), 10000);
                    actualResult = 'Chuyển hướng đến trang đăng nhập';
                    status = 'Passed';
                } catch (error) {
                    actualResult = 'Không chuyển hướng đến trang đăng nhập';
                    status = 'Failed';
                }
            } else {
                // Case: Expecting a failure (error message on the same page)
                try {
                    // Wait for the error message to appear
                    await driver.wait(until.elementLocated(By.css('.bg-red-100')), 5000);
                    const errorElement = await driver.findElement(By.css('.bg-red-100'));
                    actualResult = await errorElement.getText();

                    // Compare the actual error message with the expected result
                    if (actualResult === expectedResult) {
                        status = 'Passed';
                    } else {
                        status = 'Failed';
                    }
                } catch (err) {
                    actualResult = 'Không có thông báo lỗi';
                    status = 'Failed';
                }
            }

            // 7. Add the result to the report
            reportData.push({
                username,
                email,
                password,
                expected_result: expectedResult,
                actual_result: actualResult,
                status
            });

            console.log(`Result for ${username}: ${status}`);

            // 8. Add a delay for visibility (e.g., 3 seconds) before moving to the next test case
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error) {
        console.error('Error during registration testing:', error);
    } finally {
        // Ensure the driver is properly closed
        if (driver) {
            try {
                await driver.quit();
            } catch (quitError) {
                console.error('Error while quitting the driver:', quitError);
            }
        }

        // Write the results to a report Excel file
        const reportWorkbook = XLSX.utils.book_new();
        const reportSheet = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(reportWorkbook, reportSheet, 'Report');
        const reportFilePath = path.join(__dirname, 'test_register_report.xlsx');
        XLSX.writeFile(reportWorkbook, reportFilePath);
        console.log(`Report has been written to: ${reportFilePath}`);
    }
})();