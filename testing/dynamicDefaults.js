module.exports = values => ({
  foo: 'fooFromJs',
  barf: values.foo + values.bar
})