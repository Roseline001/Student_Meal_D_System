// Lets Jest understand the ES module "import/export" syntax used in js/.
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
};
