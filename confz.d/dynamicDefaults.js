module.exports = values => ({
  foo: 'fooFromJs',
  barf: values.foo + values.bar,
  a: ['boing', 'bounce'],
  b: {
    zzz: 'zzz',
    yyy: 'yyy',
  },
})
