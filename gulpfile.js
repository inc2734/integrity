'use strict';

/**
 * Import node modules
 */
var gulp         = require('gulp');
var stylus       = require('gulp-stylus');
var rename       = require('gulp-rename');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cssnano      = require('cssnano');
var browser_sync = require('browser-sync');
var rimraf       = require('rimraf');
var zip          = require('gulp-zip');
var uglify       = require('gulp-uglify');
var rollup       = require('gulp-rollup');
var nodeResolve  = require('rollup-plugin-node-resolve');
var commonjs     = require('rollup-plugin-commonjs');
var babel        = require('rollup-plugin-babel');
var ejs          = require('gulp-ejs');

var dir = {
  src: {
    css   : 'src/css',
    js    : 'src/js',
    images: 'src/images',
    ejs   : 'src/ejs'
  },
  dist: {
    css   : 'public/assets/css',
    js    : 'public/assets/js',
    images: 'public/assets/images',
    ejs   : 'public'
  }
}

/**
 * Build JavaScript
 */
gulp.task('js', function() {
  gulp.src(dir.src.js + '/**/*.js')
    .pipe(rollup({
      allowRealFiles: true,
      entry: dir.src.js + '/app.js',
      format: 'iife',
      external: ['jquery'],
      globals: {
        jquery: "jQuery"
      },
      plugins: [
        nodeResolve({ jsnext: true }),
        commonjs(),
        babel({
          presets: ['es2015-rollup'],
          babelrc: false
        })
      ]
    }))
    .pipe(gulp.dest(dir.dist.js))
    .on('end', function() {
      gulp.src([dir.dist.js + '/app.js'])
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(dir.dist.js));
    });
});

/**
 * Build CSS
 */
gulp.task('css', function() {
  return gulp.src(
      [
        dir.src.css + '/style.styl',
      ],
      {base: dir.src.css}
    )
    .pipe(stylus({
      'resolve url': true,
      include: 'node_modules/normalize-styl'
    }))
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
      })
    ]))
    .pipe(gulp.dest(dir.dist.css))
    .pipe(postcss([cssnano()]))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(dir.dist.css));
});

/**
 * Build images
 */
gulp.task('copy-images', ['remove-images'], function() {
  return gulp.src(dir.src.images + '/**/*')
    .pipe(gulp.dest(dir.dist.images));
});

gulp.task('remove-images', function(cb) {
  rimraf(dir.dist.images, cb);
});

/**
 * Font
 */
 gulp.task('font', function() {
   return gulp.src('./node_modules/getbasis/src/font/**')
     .pipe(gulp.dest('./public/assets/font/basis'));
 });

/**
 * EJS to HTML
 */
gulp.task('ejs', function() {
  gulp.src([
    dir.src.ejs + '/**/*.ejs',
    '!' + dir.src.ejs + '/**/_*.ejs'
  ])
  .pipe(ejs(
    {},
    {},
    {ext: '.html'})
  )
  .pipe(gulp.dest(dir.dist.ejs));
});

/**
 * Auto Build
 */
gulp.task('watch', function() {
  gulp.watch([dir.src.css + '/**/*.styl'], ['css']);
  gulp.watch([dir.src.js + '/**/*.js'], ['js']);
  gulp.watch([dir.src.ejs + '/**/*.ejs'], ['ejs']);
});

/**
 * Browsersync
 */
gulp.task('browsersync', function() {
  browser_sync.init( {
    server: {
      baseDir: dir.dist.ejs
    },
    files: [
      dir.dist.ejs + '/**'
    ]
  });
});

/**
 * Creates the zip file
 */
gulp.task('zip', ['build'], function(){
  return gulp.src(
      [
        '**',
        '.gitignore',
        '.editorconfig',
        '!node_modules',
        '!node_modules/**',
        '!bin',
        '!bin/**',
        '!integrity.zip'
      ]
      , {base: '.'}
    )
    .pipe(zip('integrity.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('build', ['css', 'js', 'ejs', 'copy-images', 'font']);

gulp.task('default', ['build', 'browsersync', 'watch']);
