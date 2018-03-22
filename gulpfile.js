/* Author: Andris Vilde */
// configuration
const cfg = {
    root: 'src/root/',
    dest: 'dist/',
    sourceCss: `src/scss/**/*.scss`,
    sourceJs: `src/js/**/*.js`,
    sourceImg: `src/img/**/*.*`,
    destCss: `dist/css`,
    destJs: `dist/js`,
    destImg: `dist/img`,
    jsAll: 'dist.js',
    jsAllMinified: 'dist.min.js'
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
const babel = require('gulp-babel');

// cleanup
gulp.task('clean', (cb) => {
    return gulp.src(cfg.dest, {
            read: false
        })
        .pipe(clean());
});

// linting
gulp.task('lint', () => {
    gulp.src([cfg.sourceJs, '!node_modules/**'])
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

// post-process JS files
gulp.task('scripts', () => {
    return gulp.src(cfg.sourceJs)
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify({
            compress: true,
            mangle: true
        }))
        .pipe(concat(cfg.jsAllMinified))
        .on('error', err => {
            util.log(util.colors.red('[Error]'), err.toString());
        })
        .pipe(gulp.dest(cfg.destJs));
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
gulp.task('post-cleanup', ['lint', 'images', 'sass', 'scripts']);