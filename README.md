# RMS Tracker Scraper - A web scraper for RMS Tracker

1. Clone the repo

```git clone https://github.com/eduubessa/rmstrackerscraper-node.git"```

2. Enter the directory

```cd rmstrackerscraper-node```

3. Install dependencies

```npm install```

4. Create a folder

```mkdir ./data```

5. Configure the mailer on the config/mailer.json file

 - Example
```json
{
  "host": "smtp.office365.com",
  "port": 587,
  "auth": {
    "user": "<username@empresa.com>",
    "pass": "<password>"
  },
  "secureConnection": false,
  "tls": {
    "ciphers": "SSLv3"
  }
}
```

6. Create file on data/mailer.json with to send the emails and last sent date

```json
{
  "to": [
    "eduardo.bessa@singularityde.com",
    "eduubessa@gmail.com",
    "andre.nunes@singularityde.com"
  ],
  "last_sent": "2022-05-18 22:00:00"
}
```

7. Run the scraper

```node app.js```
