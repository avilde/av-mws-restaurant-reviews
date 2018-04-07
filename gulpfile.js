/* Author: Andris Vilde */
// configuration
const cfg = {
  src: 'src/',
  dest: 'public/',
  destImg: `public/img`,
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
  seq = require('gulp-sequence');

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

// pre-processor for CSS (minify too)
gulp.task('sass', () => {
  return gulp
    .src(cfg.srcCss)
    .pipe(
      sass({
        outputStyle: 'compressed'
      })
    )
    .pipe(gulp.dest(cfg.tmpCss));
});

// bundle code for index.html
gulp.task('minify-list', () => {
  return gulp
    .src([`${cfg.srcJs}/signature.js`, `${cfg.srcJs}/restaurant_list.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`, `${cfg.srcJs}/lozad.js`])
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant_list.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(cfg.tmpJs));
});

// bundle code for restaurant.html
gulp.task('minify-details', () => {
  return gulp
    .src([`${cfg.srcJs}/signature.js`, `${cfg.srcJs}/restaurant_details.js`, `${cfg.srcJs}/dbhelper.js`, `${cfg.srcJs}/idb.js`, `${cfg.srcJs}/lozad.js`])
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant_details.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(cfg.tmpJs));
});

// minify service worker code
gulp.task('minify-sw', () => {
  return gulp
    .src([`${cfg.src}/sw.js`])
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
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


// html files (minify HTML files & inline css/js)
gulp.task('inline-html', function() {
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

/**
 *  [ BUILD ]
 *  build distibrutable code
 */
gulp.task('build', seq('clean', ['root-files', 'lint', 'images', 'sass', 'minify-list', 'minify-details', 'minify-sw'],'tmp-html', 'inline-html', 'clean-tmp'));

/**
 * [ SERVE ]
 *  run localhost server
 */
gulp.task('serve', () => {
  browserSync.init(
    {
      server: cfg.dest,
      port: 8000,
      ui: false
    },
    function(err, bs) {
      bs.addMiddleware('*', gStatic, {
        override: true
      });
    }
  );
});
