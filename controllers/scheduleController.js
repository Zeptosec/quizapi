const puppeteer = require('puppeteer');

const getSchedule = async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://uais.cr.ktu.lt/ktuis/stud.busenos');
        await page.click("input[type=submit]");
        await new Promise(r => setTimeout(r, 1000));
        await page.click("button[type=submit]")
        await new Promise(r => setTimeout(r, 1000));
        await page.type('#username', process.env.USER);
        await page.type('#password', process.env.PASS);
        await page.click('input[type=submit]');
        await new Promise(r => setTimeout(r, 1000));
        await page.click('#yesbutton');
        await new Promise(r => setTimeout(r, 5000));
        const query = "Mano savait";
        await page.evaluate(query => {
            const elements = [...document.querySelectorAll('a')];
            const targetElement = elements.find(e => e.innerText.includes(query));

            targetElement && targetElement.click();
        }, query)
        await new Promise(r => setTimeout(r, 2000));
        const tabl = await page.$('#kal_div_id');
        await tabl.screenshot({ path: __dirname + '/schedule.png' });

        await browser.close();
        console.log(__dirname);
        res.status(200).sendFile(`schedule.png`, { root: __dirname });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getSchedule
}