wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list

apt-get -y update
apt-get -y install google-chrome-stable

# TODO parallelize these
npx ng test --watch=false --browsers=ChromeHeadless &&
node tools/run-typings-test.js &&
bash ./test/ng-build/build.sh