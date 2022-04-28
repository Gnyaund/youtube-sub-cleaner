const object = [
  { title: "banvox", id: "UCyld2U7Yg_oWgcbegwVIRUA" },
  { title: "大石昌良の弾き語りラボ", id: "UCVIRUA" },
];

const bool = Object.prototype.hasOwnProperty.call(object[0], "id");
//console.log(object[1].id);

for (const key in object) {
  if (Object.hasOwnProperty.call(object[0], "id")) {
    console.log(object[key].id);
  }
}
