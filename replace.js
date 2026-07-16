const fs = require('fs');
const files = ['./src/screens/WorkoutsScreen.js', './src/screens/HomeScreen.js'];

const newImages = [
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1000&q=80',
  'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=1000&q=80',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1000&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&q=80',
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1000&q=80',
  'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1000&q=80',
  'https://images.unsplash.com/photo-1549476464-37392f717541?w=1000&q=80',
  'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=1000&q=80',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1000&q=80',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1000&q=80',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1000&q=80',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1000&q=80'
];
let imgIndex = 0;

let seen = new Set();

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let updated = content.replace(/https:\/\/[^\s\"\'\?]+\??[^\s\"\']*/g, (match) => {
    // Standardize URL for comparison (ignore query params)
    let base = match.split('?')[0];
    if (seen.has(base)) {
      if (imgIndex < newImages.length) {
        let newImg = newImages[imgIndex++];
        seen.add(newImg.split('?')[0]);
        return newImg;
      }
    }
    seen.add(base);
    return match;
  });
  fs.writeFileSync(f, updated);
});
console.log('Replaced ' + imgIndex + ' repeated images.');
