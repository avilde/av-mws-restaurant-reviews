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
const util = require('gulp-util');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');

// cleanup
gulp.task('clean', (cb) => {
    return gulp.src(cfg.dest, {
            read: false
        })
        .pipe(clean());
});

// linting
gulp.task('lint', () => {
    gulp.src([`${cfg.sourceJs}/**/*.js`, '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.formatEach('compact', process.stderr))
        .pipe(eslint.results(results => {
            console.log(
                `[Total] files: ${results.length}, warnings: ${results.warningCount}, errors: ${results.errorCount}`
            );
        }));
});

// images
gulp.task('images', () => {
    return gulp.src(cfg.sourceImg)
        .pipe(imagemin({
            optimizationLevel: 5
        }))
        .pipe(gulp.dest(cfg.destImg));
});

// pre-processor for CSS
gulp.task('sass', () => {
    return gulp.src(cfg.sourceCss)
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .pipe(gulp.dest(cfg.destCss));
});

// html files
gulp.task('html', function () {
    return gulp.src(`${cfg.src}*.html`)
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(cfg.dest));
});

// script files
function bundleJsEntry(inputFiles, src, dest) {
    inputFiles.forEach(function (entry, i, entries) {
        entries.remaining = entries.remaining || entries.length;

        const b = browserify({
            entries: `${src}/${entry}.js`,
            debug: true,
            transform: [babelify.configure({
                presets: ['es2015']
            })]
        });

        b
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
});

// root files
gulp.task('root-files', () => {
    bundleJsEntry(['sw'], cfg.src, cfg.dest);

    return gulp.src([
            'manifest.json',
            'favicon.ico'
        ], {
            base: cfg.src
        })
        .pipe(gulp.dest(cfg.dest));
});

// ------------ MAIN ------------

// watch source files
gulp.task('watch', () => {
    gulp.watch(cfg.sourceJs, ['lint', 'scripts']);
    gulp.watch(cfg.sourceCss, ['sass']);
});
// build distibrutable code
gulp.task('build', ['clean'], () => {
    gulp.start('post-cleanup');
});

// make cleanup synchronous
gulp.task('post-cleanup', ['lint', 'images', 'sass', 'html', 'bundle-js', 'root-files']);