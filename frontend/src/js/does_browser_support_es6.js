function doesBrowserSupportES6() {
  try {
    new Function("(a = 0) => a");
    return true;
  } catch (err) {
    return false;
  }
}

var browserSupportsES6 = doesBrowserSupportES6();

/*jshint multistr: true */
if (!browserSupportsES6) {
  alert(
    "Hey there, it looks like\
    you're using an old or unsupported browser.\
    You can't access this particular test with\
    your browser because it is not compatible\
    with our standards and/or security for your data.\
    Go to www.google.com/chrome/\
    to download a free supported browser, then\
    access the test again from there.\
    Thanks!`;",
  );
}
