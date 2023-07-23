const fs = require("fs");
const path = require("path");
const https = require("https");
const axios = require("axios");
const cheerio = require("cheerio");

async function download(url, pathname) {

    if (!fs.existsSync(pathname)) {
        fs.mkdirSync(pathname, { recursive: true });
    }

    const response = await axios.get(url, { timeout: 5000 });
    // console.log(response);
    if (response.status !== 200) {
        throw new Error(`Failed to fetch webpage: HTTP status code ${response.status}`);
    }

    const html = response.data;
    const $ = cheerio.load(html);

    const imageUrls = [];
    $("img").each((index, element) => {
      const imageUrl = $(element).attr("src");
      if (imageUrl && imageUrl.startsWith("http")) {
        imageUrls.push(imageUrl);
      }
    });

    if (imageUrls.length === 0) {
        throw new Error("No image URLs found on the webpage.");
    }

    for (const imageUrl of imageUrls) {
        const imageName = path.basename(new URL(imageUrl).pathname);
        const filename = path.join(pathname, imageName);
    
        const imageResponse = await axios.get(imageUrl, { responseType: "stream" });
    
        const outputStream = fs.createWriteStream(filename);
        imageResponse.data.pipe(outputStream);
    
        await new Promise((resolve, reject) => {
          outputStream.on("finish", resolve);
          outputStream.on("error", reject);
        });
    
        console.log(`Image downloaded and saved as ${filename}`);
    }
}

const url = "https://kovafood.com/shop-by-category/breakfast-cereals";
const pathname = "D:/workstation/Images"

download(url, pathname)
    .then(() => {
        console.log("Download completed!");
    })
    .catch((err) => {
        console.log("Error downloading file:", err.message);
    });