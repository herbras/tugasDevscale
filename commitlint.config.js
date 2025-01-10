module.exports = {
  extends: ["@commitlint/config-conventional"],
  // Conventional Commits Types:
  // feat:     Penambahan fitur baru (triggers MINOR version)
  // fix:      Perbaikan bug (triggers PATCH version)
  // docs:     Perubahan dokumentasi saja
  // style:    Perubahan formatting, titik koma, spasi (no code change)
  // refactor: Refactoring kode production
  // perf:     Peningkatan performa
  // test:     Menambah/memperbaiki tests
  // build:    Perubahan build system atau dependencies
  // ci:       Perubahan CI/CD dan konfigurasi
  // chore:    Maintenance tasks, dep updates, etc
};
