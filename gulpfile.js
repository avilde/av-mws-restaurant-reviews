/* Author: Andris Vilde */
// configuration
const cfg = {
  src: 'src/',
  dest: 'public/',
  destImg: 'public/img',
  destCss: 'public/css',
  destJs: 'public/js',
  srcCss: 'src/scss/**/*.scss',
  srcJs: 'src/js',
  srcImg: 'src/img/**/*.*',
  tmp: 'tmp/',
  tmpCss: 'tmp/css',
  tmpJs: 'tmp/js'
};
// includes
const gulp = require('gulp'),
  eslint = require('gulp-eslint'),
  sass = require('gulp-sass'),
  concat = require('gulp-concat'),
  uglifyes = require('uglify-es'),
  composer = require('gulp-uglify/composer'),
  uglify = composer(uglifyes, console),
  clean = require('gulp-clean'),
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  util = require('gulp-util'),
  sourcemaps = require('gulp-sourcemaps'),
  htmlmin = require('gulp-htmlmin'),
  gzip = require('gulp-gzip'),
  browserSync = require('browser-sync').create(),
  gStatic = require('connect-gzip-static')(cfg.dest),
  inline = require('gulp-inline'),
  seq = require('gulp-sequence'),
  watch = require('gulp-watch');

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
        console.log(`[Total] files: ${results.length}, warnings: ${results.warningCount}, errors: ${results.errorCount}`);
      })
    );
});

// images to .webp
gulp.task('images', () => {
  return gulp
    .src(cfg.srcImg)
    .pipe(
      webp({
        quality: 75,
        method: 6
      })
    )
    .pipe(gulp.dest(cfg.destImg));
});

// pre-processor for CSS (minify too) - DEV
gulp.task('sass-dev', () => {
  return gulp
    .src(cfg.srcCss)
    .pipe(sass())
    .pipe(gulp.dest(cfg.destCss));
});

// pre-processor for CSS (minify too) - PROD
gulp.task('sass-prod', () => {
  return gulp
    .src(cfg.srcCss)
    .pipe(
      sass({
        outputStyle: 'compressed'
      })
    )
    .pipe(gulp.dest(cfg.tmpCss));
});

// bundle code for index.html - DEV
gulp.task('minify-list-dev', () => {
  return gulp
    .src([`${cfg.srcJs}/global.js`, `${cfg.srcJs}/signature.js`, `${cfg.srcJs}/restaurant_list.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`, `${cfg.srcJs}/lozad.js`])
    .pipe(concat('restaurant_list.js'))
    .pipe(gulp.dest(cfg.destJs));
});

// bundle code for index.html - PROD
gulp.task('minify-list-prod', () => {
  return gulp
    .src([`${cfg.srcJs}/global.js`, `${cfg.srcJs}/signature.js`, `${cfg.srcJs}/restaurant_list.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`, `${cfg.srcJs}/lozad.js`])
    .pipe(concat('restaurant_list.js'))
    .pipe(uglify())
    .pipe(gulp.dest(cfg.tmpJs));
});

// bundle code for restaurant.html - DEV
gulp.task('minify-details-dev', () => {
  return gulp
    .src([`${cfg.srcJs}/global.js`, `${cfg.srcJs}/signature.js`, `${cfg.srcJs}/restaurant_details.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`, `${cfg.srcJs}/lozad.js`])
    .pipe(concat('restaurant_details.js'))
    .pipe(gulp.dest(cfg.destJs));
});

// bundle code for restaurant.html - PROD
gulp.task('minify-details-prod', () => {
  return gulp
    .src([`${cfg.srcJs}/global.js`, `${cfg.srcJs}/signature.js`, `${cfg.srcJs}/restaurant_details.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`, `${cfg.srcJs}/lozad.js`])
    .pipe(concat('restaurant_details.js'))
    .pipe(uglify())
    .pipe(gulp.dest(cfg.tmpJs));
});

// minify service worker code
gulp.task('minify-sw-prod', () => {
  return gulp
    .src([`${cfg.srcJs}/global.js`, `${cfg.src}/sw.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`])
    .pipe(concat('sw.js'))
    .pipe(uglify())
    .pipe(gulp.dest(cfg.dest));
});

gulp.task('minify-sw-dev', () => {
  return gulp
    .src([`${cfg.srcJs}/global.js`, `${cfg.src}/sw.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`])
    .pipe(concat('sw.js'))
    .pipe(gulp.dest(cfg.dest));
});

// copy root files
gulp.task('root-files', () => {
  gulp.src([`${cfg.src}manifest.json`, `${cfg.src}favicon.ico`]).pipe(gulp.dest(cfg.dest));
});

// copy root files
gulp.task('tmp-html', () => {
  gulp.src([`${cfg.src}index.html`, `${cfg.src}restaurant.html`]).pipe(gulp.dest(cfg.tmp));
});

// copy root files
gulp.task('dev-html', () => {
  gulp.src([`${cfg.src}index.html`, `${cfg.src}restaurant.html`]).pipe(gulp.dest(cfg.dest));
});

// html files (minify HTML files & inline css/js)
gulp.task('inline-html', function () {
  return gulp
    .src(`${cfg.tmp}*.html`)
    .pipe(
      inline({
        base: cfg.tmp,
        disabledTypes: ['svg', 'webp', 'img']
      })
    )
    .pipe(
      htmlmin({
        collapseWhitespace: true
      })
    )
    .pipe(gzip())
    .pipe(gulp.dest(cfg.dest));
});

// cleanup temp folder
gulp.task('clean-tmp', cb => {
  return gulp
    .src(cfg.tmp, {
      read: false
    })
    .pipe(clean());
});

// watch src files for changes
gulp.task('watch', () => {
  util.log(util.colors.bold(util.colors.cyan('[gulp-watch]'), util.colors.white('starting watch...')));
  // js
  gulp.watch(`${cfg.srcJs}/*`, ['minify-list-dev', 'minify-details-dev', 'minify-sw-dev']);
  // css
  gulp.watch(cfg.srcCss, ['sass-dev']);
  // img
  gulp.watch(cfg.srcImg, ['images']);
  // html
  gulp.watch(`${cfg.src}*.html`, ['dev-html']);
  // service worker
  gulp.watch(`${cfg.src}sw.js`, ['minify-sw-dev']);
});

/**
 *  [ BUILD ]
 *  build distibrutable code
 *  prod - production environment
 *  dev - development environment
 */

gulp.task('build-prod', seq('clean', 'tmp-html', 'root-files', 'lint', 'images', 'sass-prod', 'minify-list-prod', 'minify-details-prod', 'minify-sw-prod', 'inline-html', 'clean-tmp'));

gulp.task('build-dev', seq('clean', ['root-files', 'lint', 'images', 'sass-dev', 'minify-list-dev', 'minify-details-dev', 'minify-sw-dev'], 'dev-html', 'watch'));

/**
 * [ SERVER ]
 *  run localhost server
 */
gulp.task('server', () => {
  browserSync.init({
      server: cfg.dest,
      port: 8000,
      ui: false
    },
    function (err, bs) {
      bs.addMiddleware('*', gStatic, {
        override: true
      });
    }
  );
});