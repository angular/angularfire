wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list

apt-get -y update
apt-get -y install google-chrome-stable

# TODO parallelize these
npx karma start --single-run --browsers ChromeHeadlessTravis --reporters mocha