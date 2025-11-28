---
avatar-name: "dyl's page"
avatar-url: "https://indiscover.xyz/assets/img/avatar.png"
---
<p>⠀</p>

<h3>▸ i'm dyl, also known by the usernames "indiscover" and "horizoned" online ◂</h3>

<p>⠀</p>

<h3>▸ seventeen - he / him ◂</h3>

<p>⠀</p>

<h3>▸ united kingdom ◂</h3>

<p>⠀</p>

<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h3>▸ for me, it's currently: ◂</h3>
    <h4 id="gmt-time"></h4>

<script>
  function getOrdinalSuffix(n) {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  function updateUKDateTime() {
    const currentDate = new Date();

    const day = currentDate.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Europe/London' });
    const suffix = getOrdinalSuffix(parseInt(day));
    const weekday = currentDate.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Europe/London' }).toLowerCase();
    const month = currentDate.toLocaleDateString('en-GB', { month: 'long', timeZone: 'Europe/London' }).toLowerCase();

    const time = currentDate.toLocaleTimeString('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const formatted = `${weekday}, the ${day}${suffix} of ${month} – ${time}`.toLowerCase();
    document.getElementById("gmt-time").textContent = formatted;
  }

  updateUKDateTime();
  setInterval(updateUKDateTime, 1000);
</script>
</body>
</html>





