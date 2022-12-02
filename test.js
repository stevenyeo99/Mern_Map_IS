// contoh
let word = 'edcba';

// split ke array dulu tiap kata
let arrayWord = word.split('');
// size array buat diiterate
let size = arrayWord.length;

// looping berdasarkan jumlah array
for (let i = 0; i < size; i++) {
    // looping berdasarkan jumlah array - 1, jgn smpe index trkhir soal biar prevent array index exception
    // logic pick index sebelum dibanding dengan index selanjutnya (index selanjutnya tidak boleh lebih batas bisa error.)
    for (let j = 0; j < size - 1; j++) {
        if (arrayWord[j] > arrayWord[j+1]) {
            // declare local variable, biar prevent memory reference value
            // word besar
            let descWord = arrayWord[j];
            // word kecil
            let ascWord = arrayWord[j+1];

            // swap value berdasarkan assign value ke variable
            // sebelum = word kecil
            arrayWord[j] = ascWord;
            // sesudah = word besar
            arrayWord[j+1] = descWord;
        }
    }
}

// join balik kata2 yg udah disort
word = arrayWord.join('');

console.log('Ascending Word: ' + word);