/* Author: Andris Vilde */
// configuration
const cfg = {
  src: 'src/',
  dest: 'public/',
  srcCss: `src/scss/**/*.scss`,
  srcJs: `src/js`,
  srcImg: `src/img/**/*.*`,
  destCss: `public/css`,
  destJs: `public/js`,
  destImg: `public/img`
};
// includes
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console); // for ES6 code
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const util = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');
const serve = require('gulp-serve');

// cleanup (remove destination folder)
gulp.task('clean', cb => {
  return gulp
    .src(cfg.dest, {
      read: false
    })
    .pipe(clean());
});

// linting (check errors in js files)
gulp.task('lint', () => {
  gulp
    .src([`${cfg.srcJs}/**/*.js`])
    .pipe(eslint())
    .pipe(eslint.formatEach('compact', process.stderr))
    .pipe(
      eslint.results(results => {
        console.log(
          `[Total] files: ${results.length}, warnings: ${
            results.warningCount
          }, errors: ${results.errorCount}`
        );
      })
    );
});

// images to .webp
gulp.task('images', () => {
  return gulp
    .src(cfg.srcImg)
    .pipe(
      webp({
        quality: 50,
        method: 6
      })
    )
    .pipe(gulp.dest(cfg.destImg));
});

// pre-processor for CSS (minify too)
gulp.task('sass', () => {
  return gulp
    .src(cfg.srcCss)
    .pipe(
      sass({
        outputStyle: 'compressed'
      })
    )
    .pipe(gulp.dest(cfg.destCss));
});

// html files (minify HTML files)
gulp.task('html', function() {
  return gulp
    .src(`${cfg.src}*.html`)
    .pipe(
      htmlmin({
        collapseWhitespace: true
      })
    )
    .pipe(gulp.dest(cfg.dest));
});

// bundle code for index.html
gulp.task('minify-list', () => {
  return gulp
    .src([
      `${cfg.srcJs}/restaurant_list.js`,
      `${cfg.srcJs}/dbhelper.js`,
      `${cfg.srcJs}/idb.js`,
      `${cfg.srcJs}/lozad.js`
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant_list.js'))
    .pipe(
      uglify()
    )
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(cfg.destJs));
});

// bundle code for restaurant.html
gulp.task('minify-details', () => {
  return gulp
    .src([
      `${cfg.srcJs}/restaurant_details.js`,
      `${cfg.srcJs}/dbhelper.js`,
      `${cfg.srcJs}/idb.js`,
      `${cfg.srcJs}/lozad.js`
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant_details.js'))
    .pipe(
      uglify()
    )
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(cfg.destJs));
});

// minify service worker code
gulp.task('minify-sw', () => {
  return gulp
    .src([`${cfg.src}/sw.js`])
    .pipe(sourcemaps.init())
    .pipe(
      uglify()
    )
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(cfg.dest));
});

// copy root files
gulp.task('root-files', () => {
  gulp
    .src([`${cfg.src}manifest.json`, `${cfg.src}favicon.ico`])
    .pipe(gulp.dest(cfg.dest));
});

// make cleanup synchronous
gulp.task('post-cleanup', [
  'lint',
  'images',
  'sass',
  'html',
  'minify-list',
  'minify-details',
  'minify-sw',
  'root-files',
  'serve'
]);

/**
 *  [ BUILD ]
 *  build distibrutable code
 */
gulp.task('build', ['clean'], () => {
  gulp.start('post-cleanup');
});

// run localhost server
gulp.task(
  'serve',
  serve({
    root: ['public'],
    port: 8000
  })
);
