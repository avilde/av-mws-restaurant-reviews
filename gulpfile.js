/* Author: Andris Vilde */
// configuration
const cfg = {
    src: 'src/',
    dest: 'public/',
    sourceCss: `src/scss/**/*.scss`,
    sourceJs: `src/js`,
    sourceImg: `src/img/**/*.*`,
    destCss: `public/css`,
    destJs: `public/js`,
    destImg: `public/img`
};
// includes
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const util = require('gulp-util');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');

// cleanup (remove destination folder)
gulp.task('clean', (cb) => {
    return gulp.src(cfg.dest, {
            read: false
        })
        .pipe(clean());
});

// linting (check errors in js files)
gulp.task('lint', () => {
    gulp.src([`${cfg.sourceJs}/**/*.js`])
        .pipe(eslint())
        .pipe(eslint.formatEach('compact', process.stderr))
        .pipe(eslint.results(results => {
            console.log(
                `[Total] files: ${results.length}, warnings: ${results.warningCount}, errors: ${results.errorCount}`
            );
        }));
});

// images to .webp
gulp.task('images', () => {
    return gulp.src(cfg.sourceImg)
        .pipe(webp({
            quality: 50,
            method: 6
        }))
        .pipe(gulp.dest(cfg.destImg));
});

// pre-processor for CSS (minify too)
gulp.task('sass', () => {
    return gulp.src(cfg.sourceCss)
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .pipe(gulp.dest(cfg.destCss));
});

// html files (minify HTML files)
gulp.task('html', function () {
    return gulp.src(`${cfg.src}*.html`)
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(cfg.dest));
});

// script files (process JS files - minify/uglify/babelify & browserify)
function bundleJsEntry(inputFiles, src, dest) {
    inputFiles.forEach(function (entry, i, entries) {
        entries.remaining = entries.remaining || entries.length;

        browserify({
                entries: `${src}/${entry}.js`,
                debug: true,
                transform: [babelify.configure({
                    presets: ['es2015']
                })]
            })
            .bundle()
            .pipe(source(`${entry}.js`))
            .pipe(buffer())
            .pipe(sourcemaps.init({
                loadMaps: true
            }))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(dest));
    });
}
// bundle files together with imports
gulp.task('bundle-js', () => {
    bundleJsEntry([
        'restaurant_list',
        'restaurant_details'
    ], cfg.sourceJs, cfg.destJs);
    bundleJsEntry(['sw'], cfg.src, cfg.dest);
});

// process root files
gulp.task('root-files', () => {
    gulp.src([
            `${cfg.src}manifest.json`,
            `${cfg.src}favicon.ico`
        ])
        .pipe(gulp.dest(cfg.dest));
});

// watch source files
gulp.task('watch', () => {
    gulp.watch(cfg.sourceJs, ['lint', 'scripts']);
    gulp.watch(cfg.sourceCss, ['sass']);
});

// make cleanup synchronous
gulp.task('post-cleanup', ['lint', 'images', 'sass', 'html', 'bundle-js', 'root-files']);

/**
 *  [ BUILD ]
 *  build distibrutable code
 */
gulp.task('build', ['clean'], () => {
    gulp.start('post-cleanup');
});